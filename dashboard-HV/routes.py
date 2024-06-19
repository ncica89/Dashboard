from flask import Flask, render_template
from config import Config
from dashboard.dashboard import app as dashboard_app  # Import the Blueprint

app = Flask(__name__)
app.config.from_object(Config)

# Register the Blueprint
app.register_blueprint(dashboard_app)

# two decorators, same function
@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html', the_title='Hrvatske vode - Dashboard')


if __name__ == '__main__':
    app.run(debug=True)

