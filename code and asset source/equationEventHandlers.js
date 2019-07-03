(function(eventNames, convenienceApi) {
	// In this example, We'll make some simple form customizations to do math.

	// Here, we're creating an alias around console.log to call out that these 
	// are coming from this event handler, and to list the timestamp at which 
	// they're happening. In later versions of Relativity, this will be
	// possible to replace with logging from the convenienceApi's 
	// logFactory, and making use of a debugging feature. However, currently 
	// loggers produced by that api do not surface logs to the browser's console.
	var cnsl = console;
	function csl() {
		var applyArgs = [
			[
				"equation eventHandler",
				Date.now()
			].join(" ")
		].concat(
			[].slice.call(arguments)
		);
		cnsl.log.apply(cnsl, applyArgs);
	};
	
	// the object we'll have to return (this iife's public api)
	var eventHandlers = {};

	// defining private variables and functions on a single local variable.
	// This patterning this is geared around readiness for some expanded 
	// unit testing capability which is coming in later versions of Relativity Forms.
	var vars = {
		fields: {},
		fieldNames: {
			"First Operand": "FIRST_OPERAND",
			"Operator": "OPERATOR",
			"Result": "RESULT",
			"Second Operand": "SECOND_OPERAND"
		}
	};

	// helper functionality
	vars.getResourceFileUrlForApp = function getResourceFileUrlForApp(fileName) {
		// This url construction and path is not intended to be a secret, and a 
		// method for generating file urls will be exposed in the convenienceApi 
		// in a later version of Relativity Forms.
		var appGuid = "CD4757A9-FD9E-49FD-A034-6790740D0FDF";
		var version = "latest";
		return "/Relativity/RelativityApplicationWebResourceFile" + "/" + appGuid + "/" + version + "/" + fileName;
	};
	
	vars.getImageFile = function getImageFile(fileName) {
		var resourceImage = new Image();
		resourceImage.setAttribute("style", "vertical-align: middle;");
		resourceImage.src = vars.getResourceFileUrlForApp(fileName);
		return resourceImage;
	};
	
	vars.getActionBarImage = function getActionBarImage() {
		return vars.getImageFile("SoAndSoCoActionBar.png");
	};
	
	vars.getMainImage = function getMainImage() {
		return vars.getImageFile("SoAndSoCoMain.png");
	};
	
	vars.doMath = function doMath(operandA, operation, operandB) {
		var result;
		switch(operation) {
			case "+": { result = operandA + operandB; } break;
			case "-": { result = operandA - operandB; } break;
			case "*": { result = operandA * operandB; } break;
			case "/": { result = operandA / operandB; } break;
			default: break;
		}
		return result;
	}


	// event handler functions
	eventHandlers[eventNames.EVENT_HANDLERS_REGISTERED] = function(layout) {
		// https://platform.relativity.com/RelativityOne/Content/Relativity_Forms/Load_pipeline.htm#eventHan
		// In this example, this handler is only present to indicate to you that these
		// event handlers file is loaded into the form.  If you don't see this message
		// there is something wrong with the way this has been attached to the Equation
		// Object Type, or you'll see an error in the console. (Chrome F12)
		csl("Event Handlers have been registered");
	};
	
	eventHandlers[eventNames.TRANSFORM_LAYOUT] = function(layout) {
		// https://platform.relativity.com/RelativityOne/Content/Relativity_Forms/Load_pipeline.htm#transfor
		// Here we're just going to use the JSON to find the ArtifactIDs for our fields
		// In Relativity 10.3, Relativity Forms provides Field access by GUID and by Display Name
		// To convenienceApi.fieldHelper but prior to that, only the ArtifactIDs are used.
		
		// Later versions of Relativity Forms will also provide simple functions for dealing with layout data
		// prior to hydration, for example, receiving a flat Array of fields for easier manipulation.
		
		// layout is an Array of Group objects
		// https://platform.relativity.com/RelativityOne/Content/Relativity_Forms/Layout_representation_for_Relativity_forms.htm
		// layout = [Group, ...]
		// Group = { Elements: [(Category or ItemList), ...] }
		// Category = { Elements: [Field, ...] }
		layout.forEach(function(group) {
			group.Elements.forEach(function(category) {
				category.Elements.forEach(function(field) {
					var fieldKey = vars.fieldNames[field.DisplayName];
					if (!!fieldKey) {
						vars.fields[fieldKey] = field.FieldID;
					}
				})
			})
		});
		// at this point, you should see that vars.fields looks like this:
		/*
			{
				FIRST_OPERAND: (number),
				OPERATOR: (number),
				RESULT: (number),
				SECOND_OPERAND: (number)
			}
		*/
		// we'll make use of this in page interaction, and console event handlers
		csl("Field IDs mapped");
		console.dir(vars);
		csl("leaving TRANSFORM_LAYOUT");
	};
	
	eventHandlers[eventNames.HYDRATE_LAYOUT_COMPLETE] = function() {
		csl("HYDRATE_LAYOUT_COMPLETE");
		// Here, we're going to disable the Result Field, and default the Operator Field to addition
		// in Relativity 10.2 Relativity Forms adds the ability to alter the JSON data for any yes/no
		// Field to remove the "unset" state, which makes this yes/no Field defaulting unncessary.
		if (this.formViewModelTypeId !== convenienceApi.constants.FORM_VIEW_MODEL_TYPE.VIEW) {
			convenienceApi.promiseFactory.all(
				convenienceApi.fieldHelper.setIsDisabled(vars.fields.RESULT, true),
				convenienceApi.fieldHelper.setValue(vars.fields.OPERATOR, true)
			).then(function() {
				csl("HYDRATE_LAYOUT_COMPLETE finished defaulting the Operator Field, and disabling the Result Field.");
			});
		} else {
			csl("HYDRATE_LAYOUT_COMPLETE bypassed field manipulation because this is view mode.");
		}
	}
	
	eventHandlers[eventNames.CREATE_ACTION_BAR] = function() {
		// Adding a little bit of branding to the Action Bar, and 
		// making use of our Relativity Application's AdditionalHostedFiles
		// in the process.
		convenienceApi.actionBar.createDefaultActionBar();
		return convenienceApi.actionBar.containersPromise.then(
			function(containers) {
				csl("CREATE_ACTION_BAR containers promise resolved");
				var span = document.createElement("span");
				span.setAttribute("style", "padding-left: 0.5rem;");
				span.appendChild(vars.getActionBarImage());
				containers.rightSlotElement.appendChild(span);
			}	
		);
	}
	
	eventHandlers[eventNames.CREATE_CONSOLE] = function(modelData, event) {
		// Add a console to View mode, with some arbitrary markup, including
		// a branding image from our Relativity Application's AdditionalHostedFiles,
		// and a few small controls to create slightly more capable calculation than
		// the main form does within edit mode.
		// This console makes use of Fields from the layout, and also makes use of
		// the convenienceApi's modalService to display its result.
		var cApi = convenienceApi.console;
		
		// branding and title
		var brandingImage = vars.getMainImage();
		var consoleTitle = cApi.generate.sectionTitle({ innerText: "Equation Console" });
		brandingImage.setAttribute("style","display: block; margin: 0 auto 1rem;");
		
		// little form:
		// text input
		// Selector for Operation
		// Selector for Form-Driven Operand
		// button
		var consoleOperand = document.createElement("input");
		consoleOperand.setAttribute("type", "text");
		consoleOperand.setAttribute("placeholder", "Please enter a number...");
		
		var operatorSelector = document.createElement("select");
		operatorSelector.appendChild(new Option("+"));
		operatorSelector.appendChild(new Option("-"));
		operatorSelector.appendChild(new Option("*"));
		operatorSelector.appendChild(new Option("/"));
		var operandSelector = document.createElement("select");
		operandSelector.appendChild(new Option("First Operand", vars.fields.FIRST_OPERAND));
		operandSelector.appendChild(new Option("Second Operand", vars.fields.SECOND_OPERAND));

		operatorSelector.className = "rwa-input auto";
		[consoleOperand, operandSelector].forEach(function(el) {
			el.className = "rwa-input";
		});
		
		var flexdiv = document.createElement("div");
		flexdiv.setAttribute("style", "display: flex");
		flexdiv.appendChild(operatorSelector);
		flexdiv.appendChild(consoleOperand);
		

		var computeButton = cApi.generate.button({ innerText: "compute"});
		computeButton.addEventListener("click", function() {
			// get the values being used
			// operandA comes from the form - that value is a promise
			// operandB comes from the console (consoleOperand) - directly accessible
			convenienceApi.fieldHelper.getValue(
				parseInt(operandSelector.value, 10)
			).then(function(operandA) {
				var operator = operatorSelector.value;
				var operandB = consoleOperand.value || NaN;
				var result = vars.doMath(operandA, operator, parseFloat(operandB));
				var equation = "" + operandA + " " + operator + " " + operandB;				
				var confirmModalModel = {
					title: equation,
					message: equation + " = " + result,
					acceptText: "Got it!",
					cancelText: "OK then.",
					focusEls: {
						accept: computeButton,
						cancel: computeButton
					}
				};
				convenienceApi.modalService.confirm(confirmModalModel);
			});
		});
		
		// the contents of the console in a single section
		var section = cApi.generate.section(
			{},
			[
				brandingImage,
				consoleTitle,
				document.createElement("br"),
				operandSelector,
				document.createElement("br"),
				flexdiv,
				document.createElement("br"),
				computeButton
			]
		);
		return cApi.containersPromise.then(function(containers) {
			containers.rootElement.appendChild(section);
		});
	};
	
	eventHandlers[eventNames.PAGE_INTERACTION] = function(modelData, event) {
		// https://platform.relativity.com/RelativityOne/Content/Relativity_Forms/Change_pipeline.htm#pageInte
		// In this handler, we'll populate the Result Field if the interaction is a change
		// event, and it's being emitted by the Operator dropdown, or either Operand Field.
		// we'll clear the value (set to null) for the Result Field if the Operands aren't both supplied.
		
		// local variables for convenience / skipping dot property chain
		var FIRST_OPERAND = vars.fields.FIRST_OPERAND;
		var SECOND_OPERAND = vars.fields.SECOND_OPERAND;
		var OPERATOR = vars.fields.OPERATOR;
		
		if (
			(event.type === "change") && 
			([
				FIRST_OPERAND,
				SECOND_OPERAND,
				OPERATOR
			].indexOf(event.payload.fieldId) >= 0)
		) {
			var doMath = (
				modelData[FIRST_OPERAND] !== null && 
				modelData[SECOND_OPERAND] !== null
			);
			var result = doMath ? 
				vars.doMath(
					parseInt(modelData[FIRST_OPERAND], 10), 
					(!modelData[OPERATOR] ? "-" : "+"),
					parseInt(modelData[SECOND_OPERAND], 10)
				) :
				null;
			convenienceApi.fieldHelper.setValue(vars.fields.RESULT, result);
		}
	};

	// returning the public api (eventHandlers	)
	return eventHandlers;
}(eventNames, convenienceApi));
