
// PlayersController.js

module.exports = {

  find({ query }, res) {
    const { position, scoring } = query;

    if (!scoring) {
      res.json(500, {
        error: 'Scoring filter must be specified.'
      });
    }

    PlayerService.filterPlayers({ position, scoring }).then(result => res.send(result));
  },

  import(req, res) {
    PlayerService.importPlayers();
    return res.send('all done!');
  }

};
