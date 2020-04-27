module.exports = {
  client: {
    service: {
      name: "blast-calamity-graphql-app",
      url: "http://localhost:8000/graphql-dev"
    },
    includes: ['./apps/**/*.ts', './libs/**/*.ts']
  }
};