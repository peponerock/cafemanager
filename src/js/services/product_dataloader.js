/**************************************
CAFE MANAGER
Product Data Models
*****************************************/
(function(){'use strict';}());

angular.module('cafeManagerApp').factory('ProductDataLoader',['$q','DataLoader','ClassDefinitions','ProductDataModels',function($q,DataLoader,CD,PDM){

	var productsOptions = {
		allPriceable: "none", // expand|over|none
		allExpanded: true,
		allOvered: false,
		allSelectable: 'multiple', // multiple|unit|none
		selectCarousel: true,
		switchSelection:true,

		productQuantity: 1,
	};

	var prices = new PDM.Prices();
	var categories = new PDM.Categories();
	var products = new PDM.ProductsSelectable({options:productsOptions});
	var extras = new PDM.Extras();
	var modifiers = new CD.Collection();
	var modifier_extra_singles = new PDM.ModifierExtraSingles();

	var loadingProducts = $q.defer();

	var refreshContents = function(data,dontSave){
		log('ProductDataLoader: Procesando los datos');

		// if(!dontSave) DataCache.update(data);
		var updated = [];
		
		if(data.singles) updated = updated.concat(products.addElements('single',data.singles));
		if(data.packs) updated = updated.concat(products.addElements('pack',data.packs));
		if(data.categories) updated = updated.concat(categories.addElements(data.categories));
		if(data.prices) updated = updated.concat(prices.addElements(data.prices));
		if(data.extras) updated = updated.concat(extras.addElements(data.extras));
		if(data.modifiers) updated = updated.concat(modifiers.addElements(data.modifiers));
		if(data.modifier_extra_singles) updated = updated.concat(modifier_extra_singles.addElements(data.modifier_extra_singles));

		
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//SUPER CUCHUFLETA RECULIAAA. Por el momento sólo se usa en filtro por palabras clave
		var cuchufleta_ql = function(singles){ 
			log('Cuchufleteando singles');
			for(var i in singles){ 
				var single,pivot;
				single = products.get('single',singles[i].id); 

				single.packs = [];
				for(var j in single.prices){ 
					pivot = prices.get(single.prices[j].id); 
					if(pivot.type == 4){
						// PUEDE QUE YA ESTÉ NORMALIZADO
						if(pivot.pack_id) single.packs.push({id:pivot.pack_id}); 
						else single.packs.push({id:pivot.pack.id}); 
					}
				}

				single.extras = [];
				single.modifiers = [];
				for(var j in single.modifier_extra_singles){
					pivot = modifier_extra_singles.get(single.modifier_extra_singles[j].id);
					
					if(pivot.extra_id) single.extras.push({id:pivot.extra_id});
					else single.extras.push({id:pivot.extra.id});

					if(pivot.modifier_id) single.modifiers.push({id:pivot.modifier_id});
					else single.modifiers.push({id:pivot.modifier.id});
				}
			 }
		}
		if(data.singles) cuchufleta_ql(data.singles);
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		// NORMALIZAR
		// COnvierte ID's por links a objetos
		// Al normalizar, si un objeto es reemplazado, se DEBE actualizar las referencias a este.
		var sources = {
			products:products,
			categories:categories,
			prices:prices,
			modifier_extra_singles:modifier_extra_singles,
			modifiers:modifiers,
			extras:extras,
		};
		
		if(data.prices) prices.normalize(sources,data.prices);
		if(data.categories) categories.normalize(sources,data.categories);
		if(data.singles) products.normalize(sources,'single',data.singles);
		if(data.packs) products.normalize(sources,'pack',data.packs);
		if(data.modifier_extra_singles) modifier_extra_singles.normalize(sources,data.modifier_extra_singles);
		
		// Actualizar links despues de normalizar
		updated.forEach(function(element){
			if(element.reLinkReferenced) element.reLinkReferenced();
		});


		var resp = {
			productsOptions:productsOptions,
			prices:prices,
			categories:categories,
			products:products,
			extras:extras,
			modifiers:modifiers,
			modifier_extra_singles:modifier_extra_singles,
		};

		loadingProducts.resolve(resp);
	}

	updateUnit = function(type,obj){
		DataLoader.update(type,obj);		
		// DataLoader.update('single',{ name: 'Lisa Maria',id:1});
	}

	// INICIA CARGA DE DATOS
	// DataLoader.get('all').then(refreshContents);
	// DataLoader.get('all_product').then(refreshContents);
	
	// List of get types. 
	// Gives the list or an element of this at the moment to subscribe to the data loader.
	// Must match with Server names.
	var groupType = 'all_product';
	var getTypes = ['singles','packs','categories','prices','extras','modifiers','modifier_extra_singles'];
	DataLoader.suscribe(groupType,getTypes,refreshContents);
	
	return loadingProducts.promise;

}]);