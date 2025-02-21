import json
from flask import Flask, render_template, request, jsonify
import threading
import os
import requests
from groq import Groq
import certifi
import ssl
import openai

app = Flask(__name__)

os.environ['PYTHONHTTPSVERIFY'] = '0' 

def load_flashcards_from_groq(topic, language):
    client = Groq(
        api_key="<groq API Key>",
    )
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Explain the importance of fast language models",
            }
        ],
        model="llama-3.3-70b-versatile",
    )

    print(chat_completion.messages[0].content)
    return chat_completion.messages[0].content

@app.route("/test_groq", methods=["GET"])
def test_groq():
    return load_flashcards_from_groq("test", "test")

def load_flashcard_from_venice(topic, language):
	url = "https://api.venice.ai/api/v1/chat/completions"

	payload = {
		"model": "llama-3.2-3b",
		"messages": [
			{
				"role": "user",
				"content": "Whats is the distance to the moon?"
			}
		],
		"tool_choice": "null"
	}
	headers = {
		"Authorization": "Bearer <Venice API Key>",
		"Content-Type": "application/json"
	}

	response = requests.request("POST", url, json=payload, headers=headers)
	return response.text

@app.route("/test_venice", methods=["GET"])
def test_venice():
	return load_flashcard_from_venice("test","test")

def validateapiKey():

	api_key = "<openAPI API>"
	api_url = "https://api.openai.com/v1/models"

	headers = {
		"Authorization": f"Bearer {api_key}"
	}

	response = requests.get(api_url, headers=headers)

	if response.status_code == 200:
		print("API Key is valid! Available models:", response.json())
		return True
	else:
		print("Error:", response.json())
		return False

@app.route("/validate_key", methods=["GET"])
def validate_key():
	if validateapiKey():
		return "API Key Validated!"
	else:
		return "API Key Invalid!"


def load_flashcards_from_llm(topic, language):
	api_key = "<openAPI API Key>" # Replace with your Groq API key
	api_url = "https://api.groq.com/openai/v1/chat/completions"
	# api_url = "https://api.openai.com/v1/chat/completions"
	# api_url = "https://api.venice.ai/api/v1/chat/completions"

	headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

	prompt = f"""
	          Generate a JSON list of 5 flashcards for the topic '{topic}' in {language}. 
	          Each flashcard should have the following fields: 
	          - question (word or phrase in {language})
	          - answer (its translation in English)
	          - question_language (should be '{language}')
	          - answer_language (should be 'English')
	          
	          Example output:
	          [
	              {{"question": "hej", "answer": "hello", "question_language": "{language}", "answer_language": "English"}},
	              {{"question": "tack", "answer": "thank you", "question_language": "{language}", "answer_language": "English"}}
	          ]
	          Only return valid JSON.
	          """

	data = {
		"model": "gpt-4", 
		"prompt": prompt,
		"max_tokens": 300,
		"temperature": 0.5,
	}

	response = requests.post(api_url, headers=headers, json=data)

	print(data)
	print(response)

	if response.status_code == 200:
		try:
			flashcards_text = response.json()["output"]
			flashcards = json.loads(flashcards_text)
			return flashcards # Convert to Python dict
		except json.JSONDecodeError:
			print("Failed to parse JSON response.")
			return []
	else:
		print("Error:", response.json())
		return []

flashcards_lock = threading.Lock()

@app.route("/")
def index():
	return render_template("index.html")


@app.route("/get_flashcards", methods=["GET"])
def get_flashcards():
	topic = request.args.get("topic")
	if topic is None or topic == "":
		topic = "vocabulary"

	language = request.args.get("language")
	if language is None or language == "":
		language = "Swedish"

	flashcards = load_flashcards_from_llm(topic, language)

	return jsonify(flashcards)


if __name__ == "__main__":
	import os

	debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ["true", "1", "t"]
	app.run(debug=debug_mode)
