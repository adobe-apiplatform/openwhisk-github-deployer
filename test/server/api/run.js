/**
 * Runs the function defined in src/action/main.js
 */
import resource from 'resource-router-middleware';
import fn from '../../../src/action/main';

export default resource({
    /** GET /  */
    index({ params }, res) {
        res.json(fn(params));
    }
});
