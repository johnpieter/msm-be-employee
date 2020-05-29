import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';

chai.should();
chai.use(chaiHttp);

describe('Index', () => {
  before(async () => {

  });

  it('/api/v2 should have status 404 (Not Found)', (done) => {
    chai.request(app)
      .get('/api/v2')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a('object');
        done();
      });
  });
});
