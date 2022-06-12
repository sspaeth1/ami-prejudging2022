//not used selfcoded paginate


module.exports = {
  paginated(model) {
    return async (res, req, next) => {
      const page = parseInt(req.query.page);
      const limit = parsrInt(req.query.limit);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const results = {};

      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }

      if (endIndex < (await model.countDocuments().exec())) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }

      try {
        results.results = await model
          .find()
          .limit(limit)
          .skip(startIndex)
          .exec();
        next();
      } catch (e) {
        (e) => {
          res.status(500).json({ message: e.message }), console.log(err);
        };

        res.paginated = results;
      }
    };
  },
};
