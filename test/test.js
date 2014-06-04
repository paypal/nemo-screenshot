var NemoDriveX = require("../index");
var returnObj = {
	"driver": true,
	"wd": true
};
describe("nemo-screenshot ", function () {
	it("should get set up", function (done) {
		NemoDriveX.setup({}, returnObj, function (err, config, returnObj) {
			if (returnObj.screenshot) {
				//console.log("user", returnObj.user);
				done()
			} else if (err) {
				done(err)
			} else {
				done(new Error("Didn't get screenshot object back"))
			}
		})
	});
});