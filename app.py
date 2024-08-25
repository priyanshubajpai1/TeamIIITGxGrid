from flask import Flask, jsonify, request, Response, stream_with_context,render_template,send_file, abort
from fetchData import DatabaseConnector
from app_ollama import OllamaChat
import requests
from io import BytesIO
from urllib.parse import unquote
import os
import time
#from faster_whisper import WhisperModel
import whisper
import tempfile
from TTS_api import text_to_speech_generator



app = Flask(__name__)


# Initialize the chat
use_cpu = True  # You can change this based on your requirements
chat = OllamaChat(model='llama3.1:8b', ai_name='Helper', ai_role='knowledgeable AI assistant', use_cpu=use_cpu, host="http://172.16.2.17:11434")
# Load the Whisper model
#model = WhisperModel("base.en", device="cpu", compute_type="int8")
model = whisper.load_model("medium")

db_config = { 
    "host": "172.16.0.10",
    "user": "project",
    "password": "iiitg@abc",
    "database": "ecommerce"
}
db = DatabaseConnector(**db_config)
db.connect()

# Home route
@app.route('/')
def home():
    return render_template('index.html')

# About route
@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/chat', methods=['POST'])
def chat_endpoint():
    user_input = request.json.get('message')
    
    # if user_input.lower() == 'history':
    #     return jsonify({"response": chat.get_search_history()})
    
    def generate():
        yield "data: START\n\n"
        for word in chat.complete(user_input):
            yield f"data: {word}\n\n"
            #print(word)
            #time.sleep(0.01)  # Small delay to ensure words are sent individually
        yield "data: END\n\n"

    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route('/clear_context', methods=['POST'])
def clear_context():
    chat.clear_context()
    return jsonify({"message": "Context cleared"})

@app.route('/showitems', methods=['GET'])
def show_items():
    if not chat.ids:
        return jsonify({"error": "No items to display"}), 404

    product_data = db.fetch_product_data(chat.ids)
    
    if not product_data:
        return jsonify({"error": "Failed to fetch product data"}), 500

    # Convert the dictionary to a list for JSON serialization
    product_list = list(product_data.values())

    return jsonify(product_list)

@app.route('/image/<path:image_url>')
def get_image(image_url):
    # Decode the URL (in case it was encoded)
    image_url = unquote(image_url)
    
    # Ensure the URL starts with http://
    if not image_url.startswith('http://'):
        return "URL must start with http://", 400
    
    try:
        # Fetch the image from the URL
        response = requests.get(image_url, stream=True)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Create a file-like object from the image content
        image_file = BytesIO(response.content)
        
        # Determine the image type
        image_type = response.headers.get('Content-Type', 'image/jpeg')
        
        # Send the image file back to the client
        return send_file(image_file, mimetype=image_type)
    
    except requests.RequestException as e:
        # Log the error (in a production environment, you'd want to use proper logging)
        print(f"Error fetching image from {image_url}: {str(e)}")
        abort(404)  # Return a 404 error if the image can't be fetched


@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        #save the audio file in storage in wav format
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_audio_path = temp_audio.name

        # segments, _ = model.transcribe(temp_audio_path, beam_size=5)
        # transcript = " ".join([segment.text for segment in segments])
        result = model.transcribe(temp_audio_path)
        transcript = result["text"]

        os.unlink(temp_audio_path)
        print(transcript)

        return jsonify({'transcript': transcript})
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)

@app.route('/tts', methods=['POST'])
def tts():
    data = request.json
    if 'text' not in data:
        return {"error": "No text provided"}, 400
    text = data['text']
    
    def generate_audio():
        for chunk in text_to_speech_generator(text):
            yield chunk
    
    return Response(generate_audio(), mimetype='audio/wav')

@app.route('/ttsappend', methods=['POST'])
def tts_append():
    data = request.json
    if 'text' not in data:
        return {"error": "No text provided"}, 400
    text = data['text']
    
    def generate_audio():
        for chunk in text_to_speech_generator(text):
            yield chunk
    
    return Response(generate_audio(), mimetype='audio/wav')
































if __name__ == '__main__':
    context=('cert.pem','key.pem')
    app.run(debug=True, port=7002)
