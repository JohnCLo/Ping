var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Options Model
 * ===========
 */

var Option = new keystone.List('Option', {
	sortable: true,
	sortContext: 'Item:Options'
});

Option.add({
	name: { type: String, required: true, initial: true },
	item: { type: Types.Relationship, ref: 'Item', many: true, required: true, initial: true, index: true },
	price: { type: Types.Money, default: 0 },
	//who: { type: Types.Relationship, ref: 'User', many: true, index: true },
	description: { type: Types.Html, wysiwyg: true },
	slides: { type: Types.Url },
	link: { type: Types.Url },
	photo: { type: Types.CloudinaryImage },
	selected: {type: Boolean, required: true, noedit:true, default: false}

});


/**
 * Registration
 * ============
 */

Option.addPattern('standard meta');
Option.defaultColumns = 'name, item|20%';
Option.register();
