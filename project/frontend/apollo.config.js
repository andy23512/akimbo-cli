module.exports = {
  client: {
    service: {
      name: "akimbo-graphql-app",
      url: "http://localhost:8000/graphql-dev"
    },
    includes: ['./apps/**/*.ts', './libs/**/*.ts']
  }
};
