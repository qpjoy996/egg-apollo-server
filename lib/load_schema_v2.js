'use strict';
const path = require('path');
const fs = require('fs');
const typeDefFileName = 'schema.js';
const resolverFileName = 'resolver.js';

module.exports = app => {
  const defaultPath = path.join(app.baseDir, 'app/apollo/components');
  const { subscriptions } = app.config.graphql;

  const scalarPath = path.join(app.baseDir, 'app/apollo/graphql/scalars/index.js');
  const allCustomScalars = require(scalarPath);
  const directivePath = path.join(app.baseDir, 'app/apollo/graphql/directives/index.js');
  const allCustomDirectives = require(directivePath);

  let linkSchema = `
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }
  `;
  if (subscriptions) {
    linkSchema += ` 
    type Subscription {
    _: Boolean
    }
    `;
  }

  function generateTypeDefsAndResolvers() {
    const typeDefs = [ linkSchema ];
    const resolvers = { ...allCustomScalars };

    const _generateAllComponentRecursive = (path = defaultPath) => {
      const list = fs.readdirSync(path);

      list.forEach(item => {
        const resolverPath = path + '/' + item;
        const stat = fs.statSync(resolverPath);
        const isDir = stat.isDirectory();
        const isFile = stat.isFile();

        if (isDir) {
          _generateAllComponentRecursive(resolverPath);
        } else if (isFile && item === typeDefFileName) {
          const { schema } = require(resolverPath);

          typeDefs.push(schema);
        } else if (isFile && item === resolverFileName) {
          const resolversPerFile = require(resolverPath);

          Object.keys(resolversPerFile).forEach(k => {
            if (!resolvers[k]) resolvers[k] = {};
            resolvers[k] = { ...resolvers[k], ...resolversPerFile[k] };
          });
        }
      });
    };
    _generateAllComponentRecursive();

    return { typeDefs, resolvers };
  }

  const typeDefs_resolvers = generateTypeDefsAndResolvers();

  app.schemaConfig = {
    ...typeDefs_resolvers,
    schemaDirectives: {
      ...allCustomDirectives,
    },
  };
  console.log('[Davinci info]: app.schemaConfig ==>', JSON.stringify(app.schemaConfig), '=>>>', typeDefs_resolvers);
};
