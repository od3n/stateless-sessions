 var  jwt         = require('jsonwebtoken'),
      _           = require('lodash'),
      secrets     = require('../../config/secrets');

module.exports = {
  /**
   * Welcome Notice
   * @param  req
   * @param  res
   * @return Void
   */
  welcome: function(req, res){
    return res.status(200).json({ message: 'Welcome to JWT Handbook Api'});
  },

  /**
   * Register User with username, email and password and other information
   * @param  req
   * @param  res
   * @return Void
   */
  registerUser: function(req, res){
    var user            = new User();
    var secureImageUrl  = gravatar.url(req.body.email, {s: '200', r: 'x', d: 'retro'}, true);
    user.username       = req.body.username;
    user.fullname       = req.body.fullname;
    user.email          = req.body.email;
    user.password       = user.hashPassword(req.body.password);
    user.website        = req.body.website;
    user.github_profile = req.body.github_profile;
    user.address        = req.body.address;
    user.user_avatar    = secureImageUrl;

    user.save( function(err, users){
      if(err) {
        if(err.name == 'MongoError' && err.message.indexOf('$email_1') > 0 ) {
          return res.json({ Error: 'Email is already registered. Please choose another' });
        }else if ( err.name == 'MongoError' && err.message.indexOf('$username_1') > 0) {
          return res.json({ Error: 'Username is already taken. Please choose another' });
        }
      } else {
        return res.status(200).json({ success: true, message: "User Registered successfully. Please, login and be Mean" });
      }
    });
  },

  /**
   * Fetch Each User Details
   * @param   req
   * @param   res
   * @param   next
   * @return  Void
   */
  getEachUserDetails: function(req, res, next){
    var userId = req.params.user_id;

    User.findOne({_id: userId}, function (err, user) {
      if(err) {
        return res.status(404).json('User Not Found');
      }

      var userDetails = {};

      userDetails._id             = user._id;
      userDetails.email           = user.email;
      userDetails.fullname        = user.fullname;
      userDetails.username        = user.username;
      userDetails.user_avatar     = user.user_avatar;
      userDetails.admin           = user.admin;
      userDetails.bio             = user.bio;
      userDetails.hire_status     = user.hire_status;
      userDetails.address         = user.address;
      userDetails.github_profile  = user.github_profile;
      userDetails.website         = user.website;
      userDetails.twitter_handle  = user.twitter_handle;
      userDetails.registered      = user.registered_on;


      res.json({success: true, user: userDetails});
      next();
    });
  },

  /**
   * Fetch A User Details via username
   * @param  {void}   req
   * @param  {void}   res
   * @param  {Function} next
   * @return {object}
   */
  getEachUserByUsername: function(req, res, next){
    var userReal = req.params.username;

    User.find({username: userReal}, function (err, user) {
      if(err) {
        return res.status(404).json({ err: err });
      }

      if(user.length === 0){
        return res.json({ success: false, message: 'User not found.' });
      }
      else if(user.length == 1) {
        var userDetails = {};
        userDetails.email           = user[0].email;
        userDetails.fullname        = user[0].fullname;
        userDetails.username        = user[0].username;
        userDetails.user_avatar     = user[0].user_avatar;
        userDetails.admin           = user[0].admin;
        userDetails.bio             = user[0].bio;
        userDetails.hire_status     = user[0].hire_status;
        userDetails.address         = user[0].address;
        userDetails.github_profile  = user[0].github_profile;
        userDetails.website         = user[0].website;
        userDetails.registered      = user[0].registered_on;

        return res.json({success: true, user: userDetails});
      }
      next();
    });
  },

  /**
   * Reset User Password
   * @param  {void}   req
   * @param  {void}   res
   * @param  {Function} next
   * @return {object}
   */
  resetUserPassword: function(req, res, next){
    var userEmail = req.body.email;

    User.find({email: userEmail}, function (err, user) {
      if(err) {
        return res.status(404).json({ err: err , req: req.body});
      }

      if(user.length === 0){
        return res.json({ success: false, message: 'User not found.' });
      }
      else if(user.length == 1) {
        var userDetails = {};
        var hash = uuid.v4();
        userDetails.email           = user[0].email;
        userDetails.username        = user[0].username;
        userDetails.pwdResetHash    = hash;

        var transporter = nodemailer.createTransport(secrets.mailOptions);
        var senderEmail = 'admin@meanmap.com';
        var emailTo     =  userDetails.email;
        var subject     = 'Password Reset From meanmap.com';
        var text        = 'check your message';

        var mailOptions = {
          from:    senderEmail,
          to:      emailTo,
          subject: subject,
          text:    text
        };

        // Send the email
        transporter.sendMail(mailOptions, function(err, info){
          if(err){
            res.status(500).json({
              "message": "Message sending failed",
              "error": err
            });
          }
          else{
            console.log("iT WENT");
            //return res.json({ success: true, message: "Message sent successfully", response: info });
          }
        });

        transporter.close();
        return  res.status(200).json({success: true, user: userDetails});
      }
      next();
    });
  },

  /**
   * Update User Details
   * @param  req
   * @param  res
   * @param  next
   * @return Void
   */
  updateEachUserDetails: function(req, res, next){
    var userId      = req.params.user_id;
    var userDetails = req.body;

    User.update({_id: userId}, userDetails, function (err) {
      if(err) {
        return res.status(404).json({success: false, message: 'User Details Not Found', err: err});
      }

      res.status(200).json({success: true, message: 'Update Successful'});
      next();
    });
  },

  /**
   * Delete A User
   * @param  req
   * @param  res
   * @param  next
   * @return Void
   */
  deleteEachUserDetails: function(req, res, next){
    var userId   = req.params.user_id;

    User.remove({_id: userId}, function (err, user) {
      if(err) {
        return res.status(404).json({success: false, message: 'User Details Not Found'});
      }

      res.json({success: true, message: 'Delete Successful'});
      next();
    });
  },

  /**
   * Authenticate User Email and Password
   * @param  req
   * @param  res
   * @return Void
   */
  authenticateUserByEmail: function(req, res){
    var user  = new User();
    var token = jwt.sign(user, secrets.sessionSecret, { expiresInMinutes: 1440 });

    User.find({email: req.body.email}, function(err, user) {
      if(err){
        return res.status(500).json({ error: err });
      }

      if(user.length === 0){
        return res.json({ success: false, message: 'Authentication failed. User not found.' });
      }
      else if(user.length == 1) {
        var users = new User();
        users.comparePassword(req.body.password, user[0].password, function(err, result){

          if(err){
            return res.status(500).json({ error: 'Server Error'});
          }

          var userObject = user[0];
          var currUser   = _.pick(userObject, '_id', 'fullname', 'user_avatar', 'username');

          if(result){
            return res.json({
                    success: true,
                    user: currUser,
                    token: token
                  });
          } else {
            return res.json({ success: false, message: 'Authentication failed. Wrong password.' });
          }
      });
    }});
  },

  /**
   * Fetch All the Users registered on the platform
   * @param   req
   * @param   res
   * @return  void
   */
  getAllUsers: function(req, res){
     User.find({}, function(err, users) {
        return res.json(users);
     });
  },

  /**
   * Upload a photo to Meanmap's Cloudinary Server
   * @param  {void} req
   * @param  {void} res
   * @return {object}
   */
  postPhoto: function(req, res){
    var fileName = '';
    var size = '';
    var tempPath;
    var extension;
    var imageName;
    var destPath = '';
    var inputStream;
    var outputStream;
    var form = new multiparty.Form();

    form.on('error', function(err){
      console.log('Error parsing form: ' + err.stack);
    });
    form.on('part', function(part){
      if(!part.filename){
        return;
      }
      size = part.byteCount;
      fileName = part.filename;
    });
    form.on('file', function(name, file){
      tempPath     = file.path;
      cloudinary.uploader.upload(tempPath, function(result){
        var pixUrl = result.url;
        res.json({ dest: pixUrl });
      });
    });
    form.on('close', function(){
      console.log('Uploaded!!');
    });
    form.parse(req);
  }
};