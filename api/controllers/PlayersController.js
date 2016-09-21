
// PlayersController.js

module.exports = {

  find({ query }, res) {
    const { position, scoring } = query;

    if (!scoring || !position) {
      return res.json(500, {
        error: 'Scoring and Position filters must be specified.'
      });
    }

    PlayerService.filterPlayers({ position, scoring }).then(result => res.send(result));
  },

  import(req, res) {
    PlayerService.importPlayers();
    return res.send('all done!');
  }

};
