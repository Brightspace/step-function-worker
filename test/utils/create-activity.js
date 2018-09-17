const AWS = require('aws-sdk');

const stepFunction = new AWS.StepFunctions();

const stateMachineDefinition = function (options) {
	return {
		Comment: 'An Example State machine using Activity.',
		StartAt: 'FirstState',
		States: {
			FirstState: {
				Type: 'Task',
				Resource: options.activityArn,
				TimeoutSeconds: 300,
				HeartbeatSeconds: 60,
				End: true
			}
		}
	};
};

const stateMachineRoleArn = process.env.ROLE_ARN;
if (!stateMachineRoleArn) {
	throw (new Error('$ROLE_ARN should be defined to run this test'));
}

module.exports = function ({context = {}, activityName, workerName, stateMachineName}) {
	return stepFunction
		.createActivityAsync({
			name: activityName
		}).promise().bind(context).then(data => {
			context.activityArn = data.activityArn;
			context.workerName = workerName;
		}).then(function () {
			const params = {
				definition: JSON.stringify(stateMachineDefinition({activityArn: this.activityArn})), /* Required */
				name: stateMachineName, /* Required */
				roleArn: stateMachineRoleArn /* Required */
			};
			return stepFunction.createStateMachineAsync(params).promise();
		}).then(data => {
			context.stateMachineArn = data.stateMachineArn;
		}).return(context);
};
