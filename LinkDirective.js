import { mapSchema, getDirectives } from '@graphql-tools/utils';
import { GraphQLList, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import { Mongo } from 'meteor/mongo';
import { setupMongoDirective } from './MongoDirective';

export default function linkDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [mapSchema.MAP_FIELD_DEFINITION]: (field, fieldName, typeName) => {
      const directives = getDirectives(schema, field);
      const linkDirective = directives.link;
      
      if (linkDirective) {
        const objectType = schema.getType(typeName);
        
        if (!objectType._mongoCollectionName) {
          throw new Meteor.Error(
            'collection-not-found',
            `You are trying to set the link: ${fieldName} but your object type does not have @mongo directive set-up`
          );
        }

        const isArrayField = field.type instanceof GraphQLList;
        let referencedType;

        if (isArrayField) {
          referencedType = field.type.ofType;
        } else {
          referencedType = field.type;
        }

        if (referencedType instanceof GraphQLNonNull) {
          referencedType = referencedType.ofType;
        } else {
          if (!(referencedType instanceof GraphQLObjectType)) {
            throw new Meteor.Error(
              'invalid-type',
              `You are trying to attach a link on a invalid type. @link directive only works with GraphQLObjectType `
            );
          }
        }

        let referencedCollectionName = referencedType._mongoCollectionName;
        if (!referencedCollectionName) {
          const objectNodeDirectives = referencedType.astNode.directives;
          const mongoDirective = objectNodeDirectives.find(directive => {
            return directive.name.value === 'mongo';
          });

          if (mongoDirective) {
            const nameArgument = mongoDirective.arguments.find(
              argument => argument.name.value === 'name'
            );

            setupMongoDirective(referencedType, {
              name: nameArgument.value.value,
            });

            referencedCollectionName = nameArgument.value.value;
          } else {
            throw new Meteor.Error(
              'invalid-collection',
              `The referenced type does not have a collection setup using @mongo directive`
            );
          }
        }

        const thisCollectionName = objectType._mongoCollectionName;

        const referencedCollection = Mongo.Collection.get(referencedCollectionName);
        const thisCollection = Mongo.Collection.get(thisCollectionName);

        let config = {};
        if (linkDirective.to) {
          config = Object.assign({}, linkDirective);
          config.inversedBy = linkDirective.to;
          delete config.to;
        } else {
          if (linkDirective.field) {
            config = Object.assign(
              {
                type: isArrayField ? 'many' : 'one',
                field: linkDirective.field,
                index: true,
              },
              linkDirective
            );
          } else {
            throw new Meteor.Error(
              `invalid-args`,
              `You have provided invalid arguments for this link in ${thisCollectionName}. The "field" property is missing.`
            );
          }
        }

        thisCollection.addLinks({
          [fieldName]: {
            collection: referencedCollection,
            ...config,
          },
        });
      }
      
      return field;
    }
  });
}
