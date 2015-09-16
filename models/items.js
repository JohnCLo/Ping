var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Items Model
 * ===========
 */

var Item = new keystone.List('Item', {
	sortable: true,
	sortContext: 'Restaurant:Items'
});

Item.add({
	name: { type: String, required: true, initial: true },
	restaurant: { type: Types.Relationship, ref: 'Restaurant', required: true, initial: true, index: true },
	price: { type: Types.Money, default: 100 },
	//who: { type: Types.Relationship, ref: 'User', many: true, index: true },
	description: { type: Types.Html, wysiwyg: true },
	slides: { type: Types.Url },
	link: { type: Types.Url },
	photo: { type: Types.CloudinaryImage }

});

/**
 * Relationships
 * =============
 */

Item.relationship({ ref: 'Option', refPath: 'item', path: 'option' });



/**
 * Registration
 * ============
 */

Item.addPattern('standard meta');
Item.defaultColumns = 'name, restaurant|20%, who|20%';
Item.register();
