from ollama import Client
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
import time
import re
import json
import torch

class OllamaChat:
    def __init__(self, model='gemma2:27b', host='http://127.0.0.1:11434', ai_name='WalBoy', ai_role='knowledgeable AI assistant', use_cpu=False):
        self.client = Client(host=host)
        self.model = model
        self.context = ""
        self.ai_name = ai_name
        self.ai_role = ai_role
        self.search_history = []
        self.use_cpu = use_cpu
        self.ids = []
        
        # Pinecone setup
        self.pc = Pinecone(api_key="SAMPLE_API")
        self.index = self.pc.Index("SAMPLE_INDEX")
        
        # Load the sentence transformer model
        device = "cpu" if self.use_cpu else "cuda" if torch.cuda.is_available() else "cpu"
        self.sentence_model = SentenceTransformer('sentence-transformers/multi-qa-mpnet-base-cos-v1', device=device)

        # Add searcher persona to context
        self.context += f"Searcher: Hello, I'm the product searcher. I can help find products for you.\n"
    def complete(self, prompt):
        self.trim_context()
        
        if "search for" in prompt.lower():
            print("Searching........")
            search_response = self.search_products(prompt)
            self.context += f"Customer: {prompt}\nSearcher: {search_response}\n"
            for line in search_response.split('\n'):
                yield line + '\\n'
            yield '\\n\n'
        system_prompt = f"You are a {self.ai_role} named {self.ai_name}. Your role is to provide informative and engaging responses. make fake public reviews with indian names with some names being typo or usernames. give reviews when Customer asks for it.Always stick to items searched by Searcher. You will try the Customer to buy products with positive rating, and mindly criticize the items with bad rating. Dont iterate the products given by Searcher rather suggest him to click \"Look in Detail\" button to checkout items. use emojis  and markdown to talk too. Dont speak as customer or searcher.Simulate checkout for products put in cart \n "
        full_prompt = f"{system_prompt}\n{self.context}Customer: {prompt}\nAssistant: "
        stream = self.client.generate(model=self.model, prompt=full_prompt, stream=True)
        response = ""
        for chunk in stream:
            word = chunk['response']
            yield word.replace('\n', '\\n')  # Replace newlines with escaped newlines
            #yield word
            response += word
            time.sleep(0.05)
        self.context += f"Customer: {prompt}\n{self.ai_name}: {response}\n"

    def search_products(self, query):
        search_query = re.sub(r'^.*?search for\s*', '', query, flags=re.IGNORECASE).strip()
        
        try:
            query_embedding = self.sentence_model.encode(search_query).tolist()
            search_response = self.index.query(
                vector=query_embedding,
                top_k=15,
                include_metadata=True
            )
            
            results = []
            for match in search_response['matches']:
                product = {
                    "name": match['metadata'].get('product_name'),
                    "brand": match['metadata'].get('brand','no brand mentioned'),
                    "discounted_price": float(match['metadata'].get('discounted_price', 0)),
                    "rating": match['metadata'].get('product_rating', 'No rating available'),
                    "id": match['metadata'].get('id')
                }
                results.append(product)
            
            self.search_history.append({"query": search_query, "results": results})
            self.ids = []
            
            response = f"Here are the top 15 results for '{search_query}':\n\n"
            for i, product in enumerate(results, 1):
                response += f"{i}. **{product['name']}** by {product['brand']}\n\n"
                response += f"   Price: ₹{product['discounted_price']:.2f}\\n\n\n"
                response += f"   Rating: {product['rating']}\n\n"
                self.ids.append(str(product['id']))
            print(self.ids)
            response+="---------------------------------------------------\n\n"
            
            return response
        
        except Exception as e:
            return f"An error occurred while searching: {str(e)}"

    def clear_context(self):
        self.context = f"Searcher: Hello, I'm the product searcher. I can help find products for you.\n"
        self.search_history = []
        self.ids=[]

    def trim_context(self, max_length=1048576):
        while len(self.context) > max_length:
            self.context = self.context.split('\n', 2)[-1]

    def get_search_history(self):
        return json.dumps(self.search_history, indent=2)
