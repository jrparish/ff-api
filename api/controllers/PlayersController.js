
// PlayersController.js

const csv = require('fast-csv');
const fs = require('fs');
const http = require('http');

module.exports = {

  find(req, res) {
    return res.send('testing');
  },

  import(req, res) {
    const positions = ['QB', 'RB', 'WR', 'TE', 'Flex', 'K', 'DST'];
    positions.forEach(position => getPlayerData(position));
    return res.send('all done!');
  }

};

function getPlayerData(position) {
  http.get({
    host: 's3-us-west-1.amazonaws.com',
    port: 80,
    path: `/fftiers/out/current/weekly-${position}.csv`
  }, response => {
    let responseData = '';
    response
      .on('data', data => {
        responseData += data;
      })
      .on('end', () => {
        const results = [];
        csv
          .fromString(responseData, { headers: true })
          .on('data', data => {
            data.position = position;
            data.scoring = 'STANDARD';
            results.push(data);
          })
          .on('end', result => {
            const criteria = mapPlayerCriteria(results);
            const players = mapPlayerData(results);

            Players.findOrCreate(players).then(() => {
              return results;
            });
          });
        });
  });
}

function mapPlayerCriteria(players = []) {
  return players.map(player => ({
    name: player['Player.Name'],
    position: player['position'],
    scoring: player['scoring']
  }));
}

function mapPlayerData(players = []) {
  return players.map(player => ({
    name: player['Player.Name'],
    team: player['Team'],
    matchup: player['Matchup'],
    bestRank: player['Best.Rank'],
    worstRank: player['Worst.Rank'],
    avgRank: player['Avg.Rank'],
    stdDev: player['Std.Dev'],
    rank: player['Rank'],
    tier: player['Tier'],
    position: player['position'],
    scoring: player['scoring']
  }));
}
