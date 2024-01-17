"use strict";

describe("Item Tags Box", function () {
	var win, doc, collectionsView;
	
	before(function* () {
		win = yield loadZoteroPane();
		doc = win.document;
		
		// Wait for things to settle
		yield Zotero.Promise.delay(100);
	});
	after(function () {
		win.close();
	});
	
	
	describe("Tag Editing", function () {
		it("should update tag when pressing Enter in textbox", async function () {
			// Bring the window to the front. Without this, fields will never get focus.
			Zotero.Utilities.Internal.activate();
			Zotero.Utilities.Internal.activate(Zotero.getMainWindow());
			await Zotero.Promise.delay(100);
			
			var tag = Zotero.Utilities.randomString();
			var newTag = Zotero.Utilities.randomString();
			
			var item = await createDataObject('item', { tags: [{ tag }] });
			
			var tagsbox = doc.querySelector('#zotero-editpane-tags');
			var rows = tagsbox.querySelectorAll('.row editable-text');
			assert.equal(rows.length, 1);
			assert.equal(rows[0].value, tag);
			
			var firstRow = rows[0];
			firstRow.focus();
			await Zotero.Promise.delay(100);
			firstRow.ref.value = newTag;
			firstRow.ref.dispatchEvent(new Event('input'));
			
			// Press Enter in textbox
			var enterEvent = new KeyboardEvent('keydown', {
				'key': 'Enter',
				'code': 'Enter',
				'keyCode': 13,
				'which': 13
			});
			let promise = waitForItemEvent('modify');
			firstRow.ref.dispatchEvent(enterEvent);
			await promise;
			
			rows = tagsbox.querySelectorAll('.row editable-text');
			assert.equal(rows[0].value, newTag);
			assert.equal(rows.length, 1);
		});
	});
	
	
	describe("#notify()", function () {
		it("should update an existing tag on rename", function* () {
			var tag = Zotero.Utilities.randomString();
			var newTag = Zotero.Utilities.randomString();
			
			var item = createUnsavedDataObject('item');
			item.setTags([
				{
					tag: tag
				}
			]);
			yield item.saveTx();
			var tagsbox = doc.querySelector('#zotero-editpane-tags');
			var rows = tagsbox.querySelectorAll('.row');
			assert.equal(rows.length, 1);
			assert.equal(rows[0].querySelector("editable-text").value, tag);
			
			yield Zotero.Tags.rename(Zotero.Libraries.userLibraryID, tag, newTag);
			
			rows = tagsbox.querySelectorAll('.row');
			assert.equal(rows.length, 1);
			assert.equal(rows[0].querySelector("editable-text").value, newTag);
		})
		
		it("should update when a tag's color is removed", function* () {
			var libraryID = Zotero.Libraries.userLibraryID;
			
			var tag = Zotero.Utilities.randomString();
			
			yield Zotero.Tags.setColor(libraryID, tag, "#990000");
			var item = createUnsavedDataObject('item');
			item.setTags([
				{
					tag: tag,
				},
				{
					tag: "_A"
				}
			]);
			yield item.saveTx();
			
			var tagsbox = doc.querySelector('#zotero-editpane-tags');
			var rows = tagsbox.querySelectorAll('.row');

			// Colored tags are sorted first
			assert.ok(getComputedStyle(rows[0]).getPropertyValue('--tag-color'));
			assert.equal(rows[0].querySelector("editable-text").value, tag);
			
			assert.notOk(getComputedStyle(rows[1]).getPropertyValue('--tag-color'));
			assert.equal(rows[1].querySelector("editable-text").value, "_A");
			
			yield Zotero.Tags.setColor(libraryID, tag, false);
			
			// No color remains on the tag
			rows = tagsbox.querySelectorAll('.row');
			assert.notOk(getComputedStyle(rows[0]).getPropertyValue('--tag-color'));
			assert.notOk(getComputedStyle(rows[1]).getPropertyValue('--tag-color'));
		})
		
		it("should update when a tag is removed from the library", function* () {
			var tag = Zotero.Utilities.randomString();
			
			var item = createUnsavedDataObject('item');
			item.setTags([
				{
					tag: tag
				}
			]);
			yield item.saveTx();
			
			var tagsbox = doc.querySelector('#zotero-editpane-tags');
			var rows = tagsbox.querySelectorAll('.row');
			assert.equal(rows.length, 1);
			assert.equal(rows[0].querySelector("editable-text").value, tag);
			
			yield Zotero.Tags.removeFromLibrary(Zotero.Libraries.userLibraryID, Zotero.Tags.getID(tag));
			
			rows = tagsbox.querySelectorAll('.row');
			assert.equal(rows.length, 0);
		})
	})
})
