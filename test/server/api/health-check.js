import resource from 'resource-router-middleware';

export default resource({
    /** GET /  */
    index({ params }, res) {
        res.json({status: 'ok'});
    }
});
