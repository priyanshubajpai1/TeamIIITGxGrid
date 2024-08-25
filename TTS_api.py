import torch
from openvoice import se_extractor
from openvoice.api import ToneColorConverter
from melo.api import TTS
import os
import re


# Initialize OpenVoice and MeloTTS
device = "cuda:0" if torch.cuda.is_available() else "cpu"
ckpt_converter = 'OpenVoice/checkpoints_v2/converter'
output_dir = 'outputs_v2'
tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')
os.makedirs(output_dir, exist_ok=True)

# Load the target speaker embedding
reference_speaker = 'OpenVoice/testsample.mp3'  # Make sure this file exists
target_se, _ = se_extractor.get_se(reference_speaker, tone_color_converter, vad=True)

# Initialize MeloTTS
tts_model = TTS(language='EN_NEWEST', device=device)

def text_to_speech_generator(text):
    print(device)
    # Split the text into sentences
    sentences = re.split('(?<=[.!?]) +', text)
    
    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue
        
        # Use a temporary file for intermediate audio
        src_path = f'OpenVoice/{output_dir}/tmp_{i}.wav'
        
        # Generate speech using MeloTTS
        speaker_id = tts_model.hps.data.spk2id['EN-Newest']
        tts_model.tts_to_file(sentence, speaker_id, src_path, speed=1.0)
        
        # Load the source speaker embedding
        source_se = torch.load(f'OpenVoice/checkpoints_v2/base_speakers/ses/en-newest.pth', map_location=device)
        
        # Convert using OpenVoice
        output_path = f'OpenVoice/{output_dir}/output_{i}.wav'
        encode_message = "@MyShell"
        tone_color_converter.convert(
            audio_src_path=src_path,
            src_se=source_se,
            tgt_se=target_se,
            output_path=output_path,
            message=encode_message
        )
        
        # Read and yield the converted audio
        with open(output_path, 'rb') as audio_file:
            yield audio_file.read()