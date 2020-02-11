'use strict';

/*
 * GET
 */
router.get('/', (req, res) => {
  res.sendFile(`${dir}/views/index.html`);
});

module.exports = router;
