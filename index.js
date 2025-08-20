import directiveDefinitions from './directiveDefinitions';
import linkDirectiveTransformer from './LinkDirective';
import mapToDirectiveTransformer from './MapToDirective';
import mongoDirectiveTransformer from './MongoDirective';

const transformers = {
  mongo: mongoDirectiveTransformer,
  link: linkDirectiveTransformer,
  map: mapToDirectiveTransformer,
};

export {
  transformers,
  directiveDefinitions,
  linkDirectiveTransformer,
  mapToDirectiveTransformer,
  mongoDirectiveTransformer,
};
