var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Item Photos Model
 * ===========
 */

var ItemPhoto = new keystone.List('ItemPhoto', {
	sortable: true,
	sortContext: 'Item:ItemPhoto'
});

ItemPhoto.add({
	item: { type: Types.Relationship, ref: 'Item', required: true, initial: true, index: true },
	user: { type: Types.Relationship, ref: 'User', required: true, initial: true, index: true },
	photo: { type: Types.CloudinaryImage }

});


/**
 * Registration
 * ============
 */

ItemPhoto.addPattern('standard meta');
ItemPhoto.defaultColumns = 'item';
ItemPhoto.register();
