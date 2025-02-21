import json
from flask import Flask, render_template, request, jsonify
import threading
import os

app = Flask(__name__)

language = "Swedish"
flashcards_file = os.path.join(os.getcwd(), 'data' , language , 'vocabulary.json')

# Load flashcards from JSON file
def load_flashcards(flashcards_file):
    if os.path.exists(flashcards_file):
        with open(flashcards_file, 'r', encoding='utf-8') as f:
            flashcards = json.load(f)
        return flashcards

flashcards = load_flashcards(flashcards_file)
flashcards_lock = threading.Lock()

@app.route('/')
def index():
    return render_template('index.html', flashcards=flashcards, language=language)

@app.route('/get_flashcards', methods=['GET'])
def get_flashcards():
    topic = request.args.get('topic')
    if topic is None or topic == "":
        topic = 'vocabulary'
        
    language = request.args.get('language')
    if language is None or language == "":
        language= 'Swedish'

    flashcards_file = os.path.join(os.getcwd(), 'data',language, f'{topic}.json')
    flashcards = load_flashcards(flashcards_file)
    return jsonify(flashcards)

@app.route('/flashcards_json')
def flashcards_json():
    return jsonify(flashcards)

if __name__ == '__main__':
    import os
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(debug=debug_mode)
