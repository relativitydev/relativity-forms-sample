using kCura.EventHandler;

namespace EventHandlerExampleApplication
{
	[System.Runtime.InteropServices.Guid("74ed835d-5f79-4c35-8fbc-fdfa5a5a162f")]
	[kCura.EventHandler.CustomAttributes.Description("Equation Page Interaction event handler for Relativity Forms Arithmetic")]
	public class EquationEventHandler : kCura.EventHandler.PageInteractionEventHandler
	{
		public override Response PopulateScriptBlocks()
		{
			return new Response();
		}

		public override string[] ScriptFileNames
		{
			get
			{
				return new string[] { "equationEventHandlers.js" };
			}
		}

		public override string[] AdditionalHostedFileNames
		{
			get
			{
				return new string[] { "SoAndSoCoActionBar.png", "SoAndSoCoMain.png" };
			}
		}
	}
}