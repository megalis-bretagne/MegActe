from app import create_app
import argparse

def parse_arguments():
    parser = argparse.ArgumentParser(description='Run the Flask application.')
    parser.add_argument('--port', type=int, default=5000, help='Port number for the Flask application')
    parser.add_argument('--host', type=str, default='127.0.0.1')
    return parser.parse_args()

app_flask = create_app()


if __name__ == "__main__":
    args = parse_arguments()
    app_flask.run(port=args.port,host=args.host)