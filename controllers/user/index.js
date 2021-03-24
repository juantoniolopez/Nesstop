const listUsers = require('./listUsers');
const getUser = require("./getUser");
const newUser = require("./newUser");
const validateUser = require("./validateUser");
const loginUser = require("./loginUser");
const editUser = require('./editUser');
const deleteUser = require("./deleteUser");
const userVote = require("./userVote");
const addUserComp = require("./addUserComp");
const userEditVote = require("./userEditVote");
const editUserPassword = require("./editUserPassword");
const forgotUserPassword = require("./forgotUserPassword");
const validateNewPassword = require("./validateNewPassword");

module.exports = { listUsers, getUser, newUser, validateUser, loginUser, editUser, deleteUser, addUserComp, userVote, userEditVote, editUserPassword, forgotUserPassword, validateNewPassword };