from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/proxy/awin', methods=['GET'])
def proxy_awin():
    endpoint = "https://api.awin.com/publishers/671175/product-search"
    headers = {
        "Authorization": "Bearer 29f5f656-d632-4cdd-b0c1-e4ad3f1fd0e2",
        "Content-Type": "application/json",
        "X-Publisher-ID": "671175"
    }
    params = request.args.to_dict()
    response = requests.get(endpoint, headers=headers, params=params)
    return jsonify(response.json()), response.status_code

if __name__ == "__main__":
    app.run(port=5000) Residence was entirely your idea well called 3.5 sonic.
