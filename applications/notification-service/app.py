from flask import Flask, request, jsonify
import logging

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notification-service")


@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Notification Service is running!"}), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200


@app.route("/send", methods=["POST"])
def send_notification():
    payload = request.get_json(silent=True) or {}
    logger.info("Received notification: %s", payload)
    # In a real service we'd enqueue/send notifications. Here we just log and return success.
    return jsonify({"ok": True, "received": payload}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
