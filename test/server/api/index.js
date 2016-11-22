import { Router } from 'express';
import healthcheck from './health-check';
import run from './run';

export default function() {
	var api = Router();

	// mount the health-check resource
	api.use('/health-check', healthcheck);

	api.use('/run', run);

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({
			version : '1.0.0'
		});
	});

	return api;
}
