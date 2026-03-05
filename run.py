from app import create_app

app = create_app()

if __name__ == "__main__":
    # Tu peux mettre debug=False en production
    app.run(debug=True)

