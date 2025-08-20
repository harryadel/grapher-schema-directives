import { mapSchema, getDirectives } from '@graphql-tools/utils';
import { Mongo } from 'meteor/mongo';

export default function mongoDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [mapSchema.MAP_OBJECT_TYPE]: (type) => {
      const directives = getDirectives(schema, type);
      const mongoDirective = directives.mongo;
      
      if (mongoDirective && mongoDirective.name) {
        setupMongoDirective(type, { name: mongoDirective.name });
      }
      
      return type;
    }
  });
}

export function setupMongoDirective(type, args) {
  const { name } = args;

  type._mongoCollectionName = name;

  let collection = Mongo.Collection.get(name);
  if (!collection) {
    collection = new Mongo.Collection(name);
  }
}
