class App extends React.Component {
  state = {
    value: '',
    data: null,
  };

  componentDidMount() {
    const id = '3370978';
    this.setState({ value: id });
    this.load(id);
  }

  onSubmit = e => {
    e.preventDefault();
    this.load(this.state.value);
  };

  load = async id => {
    const res = await fetch(`/call/${id}`);
    const data = await res.json();
    this.setState({ data });
  };

  random = async e => {
    e.preventDefault();

    const res = await fetch(`/random-call`);
    const data = await res.json();
    const id = String(data.randomId);

    this.setState({ value: id });
    this.load(id);
  };

  render() {
    const analysedCase = this.state.data;

    return (
      <div>
        <div>
          <form onSubmit={this.onSubmit}>
            <input
              value={this.state.value}
              onChange={e => this.setState({ value: e.target.value })}
            />
            <button>apply</button>
            <button onClick={this.random}>random</button>
          </form>
        </div>
        <div>
          {analysedCase && (
            <div>
              <p>
                <a href={analysedCase.call.mixedfilepath_hash}>
                  Call #{analysedCase.call.calltrackingid}
                </a>
              </p>
              <pre>{analysedCase.call.text}</pre>
              <p>
                <b>user</b> #{analysedCase.call.realtyuserid}
              </p>
              {analysedCase.offersAnalyses.map(analysis => {
                const offer = analysedCase.offers.find(
                  o => o.realtyid === analysis.realtyid,
                );
                const isMarked =
                  analysedCase.markup &&
                  analysedCase.markup.realtyid === analysis.realtyid;

                return (
                  <div className={`offer${isMarked ? ' offer-marked' : ''}`}>
                    <p>
                      <b>Offer</b>{' '}
                      <a
                        href={`https://www.cian.ru/sale/flat/${analysis.realtyid}/`}
                      >
                        #{analysis.realtyid}
                      </a>
                      &nbsp;
                      <b>score</b> {analysis.score}&nbsp;
                      <b>category</b> {offer && offer.category}&nbsp;
                      <b>address</b>{' '}
                      {offer && offer.geo.address.map(x => x.name).join(', ')}
                      &nbsp;
                      <b>rooms</b> {offer && offer.roomscount}
                    </p>
                    <table>
                      <tbody>
                        <tr>
                          <td>street</td>
                          <td>
                            <pre>{JSON.stringify(analysis.street) || '—'}</pre>
                          </td>
                        </tr>
                        <tr>
                          <td>house</td>
                          <td>
                            <pre>{JSON.stringify(analysis.house) || '—'}</pre>
                          </td>
                        </tr>
                        <tr>
                          <td>dealtype</td>
                          <td>
                            <pre>
                              {JSON.stringify(analysis.dealtype) || '—'}
                            </pre>
                          </td>
                        </tr>
                        <tr>
                          <td>offertype</td>
                          <td>
                            <pre>
                              {JSON.stringify(analysis.offertype) || '—'}
                            </pre>
                          </td>
                        </tr>
                        <tr>
                          <td>roomscount</td>
                          <td>
                            <pre>
                              {JSON.stringify(analysis.roomscount) || '—'}
                            </pre>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
              <pre>{JSON.stringify(analysedCase, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
