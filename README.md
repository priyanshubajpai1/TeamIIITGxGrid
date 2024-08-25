1. Imports and Initializations:
   - The necessary libraries are imported, including Flask, database connector, OllamaChat, and Whisper for speech recognition.
   - A Flask app is created.
   - An OllamaChat instance is initialized for handling chat functionality.
   - A Whisper model is loaded for speech recognition.
   - A database connection is established using provided credentials.

2. Routes:
   a. Home ('/') and About ('/about'):
      - Render respective HTML templates.

   b. Chat ('/chat'):
      - Receives user input via POST request.
      - Streams the AI's response word by word using server-sent events.

   c. Clear Context ('/clear_context'):
      - Clears the chat context.

   d. Show Items ('/showitems'):
      - Fetches and returns product data from the database based on stored IDs.

   e. Image Proxy ('/image/<path:image_url>'):
      - Fetches an image from a given URL and serves it to the client.

   f. Transcribe ('/transcribe'):
      - Receives an audio file.
      - Uses Whisper model to transcribe the audio to text.
      - Returns the transcription.

   g. Text-to-Speech ('/tts' and '/ttsappend'):
      - Receives text via POST request.
      - Generates audio from the text using a TTS generator.
      - Streams the audio back to the client.

3. Main Execution:
   - The server runs on port 7002 with SSL context (using cert.pem and key.pem).

Key Algorithms:

1. Chat Algorithm:
   - Uses OllamaChat for generating responses.
   - Implements streaming to send words as they're generated.

2. Speech Recognition:
   - Uses Whisper model to transcribe audio files.
   - Saves uploaded audio to a temporary file, transcribes it, then deletes the file.

3. Text-to-Speech:
   - Utilizes a custom TTS generator to convert text to audio.
   - Streams the audio in chunks.

4. E-commerce Integration:
   - Fetches product data from a MySQL database based on IDs stored in the chat context.

5. Image Serving:
   - Acts as a proxy to fetch and serve images from external URLs.

This server combines various AI and web technologies to create a multi-functional application capable of handling text-based chat, voice input/output, and e-commerce data retrieval. The use of streaming responses allows for real-time interaction in both chat and audio contexts.
