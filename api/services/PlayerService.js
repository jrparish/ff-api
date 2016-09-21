const csv = require('fast-csv');
const http = require('http');
const { includes } = require('lodash');

// Attributes
const PLAYER_NAME = 'Player.Name';
const POSITION = 'position';
const SCORING = 'scoring';
const TEAM = 'Team';
const MATCHUP = 'Matchup';
const BEST_RANK = 'Best.Rank';
const WORST_RANK = 'Worst.Rank';
const AVG_RANK = 'Avg.Rank';
const STD_DEV = 'Std.Dev';
const RANK = 'Rank';
const TIER = 'Tier';

// Positions
const QB = 'QB';
const RB = 'RB';
const WR = 'WR';
const TE = 'TE';
const FLEX = 'Flex';
const K = 'K';
const DST = 'DST';

// Scoring
const STANDARD = { name: 'STANDARD', prefix: '' };
const PPR = { name: 'PPR', prefix: 'PPR-' };
const HALF_PPR = { name: 'HALF_PPR', prefix: 'HALF-POINT-PPR-' };

function filterPlayers({ position, scoring }) {
  // Set scoring to standard if non-receiving position
  if (includes([QB, K, DST], position)) {
    scoring = STANDARD.name;
  }

  return Players
    .find({ position, scoring })
    .sort('rank ASC');
}

function importPlayers() {
  const standardPositions = [QB, RB, WR, TE, FLEX, K, DST].map(position => ({ position, scoring: STANDARD }));
  const pprPositions = [RB, WR, TE, FLEX].map(position => ({ position, scoring: PPR }));
  const halfPprPositions = [RB, WR, TE, FLEX].map(position => ({ position, scoring: HALF_PPR }));
  const positions = [...standardPositions, ...pprPositions, ...halfPprPositions ];
  positions.forEach(generatePlayerData);
}

function generatePlayerData({ position, scoring }) {
  http.get({
    host: 's3-us-west-1.amazonaws.com',
    port: 80,
    path: `/fftiers/out/current/weekly-${scoring.prefix}${position}.csv`
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
            data.scoring = scoring.name;
            results.push(data);
          })
          .on('end', result => {
            const criteria = mapPlayerCriteria(results);
            const players = mapPlayerData(results);

            Players.findOrCreate(criteria, players).then(() => {
              return results;
            });
          });
      });
  });
}

function mapPlayerCriteria(players = []) {
  return players.map(player => ({
    name: player[PLAYER_NAME],
    position: player[POSITION],
    scoring: player[SCORING]
  }));
}

function mapPlayerData(players = []) {
  return players.map(player => ({
    name: player[PLAYER_NAME],
    team: player[TEAM],
    matchup: player[MATCHUP],
    bestRank: player[BEST_RANK],
    worstRank: player[WORST_RANK],
    avgRank: player[AVG_RANK],
    stdDev: player[STD_DEV],
    rank: player[RANK],
    tier: player[TIER],
    position: player[POSITION],
    scoring: player[SCORING]
  }));
}

module.exports = {
  filterPlayers,
  importPlayers
};
