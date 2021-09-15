import { NextApiHandler } from 'next';

const ApiKey = process.env.API_KEY;

const Api: NextApiHandler = async (req, res) => {
  fetch('https://jlp.yahooapis.jp/KouseiService/V2/kousei', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `Yahoo AppID: ${ApiKey}`,
    },
    body: JSON.stringify({
      id: '0',
      jsonrpc: '2.0',
      method: 'jlp.kouseiservice.kousei',
      params: {
        q: req.query['q'] || '',
      },
    }),
  }).then((r) => {
    Object.entries(r.headers).forEach((v) => res.setHeader(...v));
    res.send(r.body);
  });
};
export default Api;
