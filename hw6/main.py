from flask import Flask, send_from_directory
import json
import requests
import time
from datetime import datetime
from dateutil.relativedelta import relativedelta

app = Flask(__name__)
apiKey = 'c84l0gqad3i9u79ha73g'
headers = {'X-Finnhub-Token': apiKey}
base_URL = 'https://finnhub.io/api/v1'

@app.route('/')
def main():
    return send_from_directory("static", 'index.html')

@app.route("/company/<string:symbol>", methods=['GET'])
def company(symbol):
    return requests.get('{}/stock/profile2?symbol={}'.format(base_URL, symbol), headers=headers).json()


@app.route("/summary/<string:symbol>", methods=['GET'])
def summary(symbol):
    return requests.get('{}/quote?symbol={}'.format(base_URL, symbol), headers=headers).json()


@app.route("/recommendation/<string:symbol>", methods=['GET'])
def recommendation(symbol):
    return sorted(json.loads(requests.get('{}/stock/recommendation?symbol={}'.format(base_URL, symbol), headers=headers).text),key=lambda x:x["period"])[-1]

@app.route("/candle/<string:symbol>", methods=['GET'])
def candle(symbol):
    """
    f: UNIX timestamp. num of weeks
    t: UNIX timestamp. current time
    """
    t = datetime.now()
    f = int(time.mktime((t + relativedelta(months=-6, days=-1)).timetuple()))
    t = int(time.mktime(t.timetuple()))
    return requests.get('{}/stock/candle?symbol={}&resolution=D&from={}&to={}'.format(base_URL, symbol, f, t), headers=headers).json()


@app.route("/news/<string:symbol>", methods=['GET'])
def news(symbol):
    """
    f: date YYYY-MM-DD
    t: date YYYY-MM-DD
    """
    t = datetime.now()
    f = t + relativedelta(days=-30)
    return requests.get('{}/company-news?symbol={}&from={}&to={}'.format(base_URL, symbol, str(f)[:10], str(t)[:10]), headers=headers).text

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)