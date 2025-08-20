import { mapSchema, getDirectives } from '@graphql-tools/utils';
import { GraphQLScalarType } from 'graphql';
import { Mongo } from 'meteor/mongo';

function resolve(path, obj) {
  return path.split('.').reduce(function(prev, curr) {
    return prev ? prev[curr] : undefined;
  }, obj || self);
}

export default function mapToDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [mapSchema.MAP_FIELD_DEFINITION]: (field, fieldName, typeName) => {
      const directives = getDirectives(schema, field);
      const mapDirective = directives.map;
      
      if (mapDirective && mapDirective.to) {
        const objectType = schema.getType(typeName);
        
        if (!objectType._mongoCollectionName) {
          throw new Meteor.Error(
            'collection-not-found',
            `You are trying to set mapTo: ${fieldName} but your object type does not have @mongo directive set-up`
          );
        }

        const isScalar = field.type instanceof GraphQLScalarType;
        if (!isScalar) {
          throw new Meteor.Error(
            'collection-not-found',
            `You are trying to set the mapTo directive on a non-scalar on field ${fieldName}`
          );
        }

        const collection = Mongo.Collection.get(objectType._mongoCollectionName);

        collection.addReducers({
          [fieldName]: {
            body: {
              [mapDirective.to]: 1,
            },
            reduce(obj) {
              return resolve(mapDirective.to, obj);
            },
          },
        });
      }
      
      return field;
    }
  });
}
