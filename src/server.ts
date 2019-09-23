import * as express from 'express';
import { Pool } from 'pg';
import { readOne, getRandomId } from './input';
import { enhanceCase } from './enhance';
import { analyseCase } from './analyse/index';

const pool = new Pool();

const app = express();

app.use('/', express.static('static'));

app.get('/random-call', async (req, res) => {
  try {
    const randomId = await getRandomId(pool);
    res.send({ randomId });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/call/:id', async (req, res) => {
  try {
    const inputCase = await readOne(pool, Number(req.params.id));

    if (!inputCase) {
      res.sendStatus(404);
      return;
    }

    const enhancedCase = await enhanceCase(inputCase);
    const analysedCase = analyseCase(enhancedCase);

    res.send(analysedCase);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(3000);
