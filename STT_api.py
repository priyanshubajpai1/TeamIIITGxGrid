import os
import tempfile
from flask import request, jsonify, Blueprint,Response, stream_with_context
from faster_whisper import WhisperModel
import time



audio_api = Blueprint('audio_api', __name__)
@audio_api.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    #save the audio file in storage in wav format
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
        audio_file.save(temp_audio.name)
        temp_audio_path = temp_audio.name

    segments, _ = model.transcribe(temp_audio_path, beam_size=5)
    user_input = " ".join([segment.text for segment in segments])

    os.unlink(temp_audio_path)
    def generate():
        yield "data: START\n\n"
        for word in chat.complete(user_input):
            yield f"data: {word}\n\n"
            #print(word)
            #time.sleep(0.01)  # Small delay to ensure words are sent individually
        yield "data: END\n\n"

    return Response(stream_with_context(generate()), content_type='text/event-stream')