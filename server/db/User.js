const { validate } = require('schema-utils');
const { ValidationErrorItem } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('./db');
const { Op } = require("sequelize");

const User = db.define('user', {
  // Add your Sequelize fields here
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    unique: true
  },
  userType: {
    type: Sequelize.ENUM(['STUDENT','TEACHER']),
    defaultValue: 'STUDENT',
    allowNull: false
  },
  isStudent: {
    type: Sequelize.VIRTUAL,
    get() {
      return this.userType === 'STUDENT'
    }
  },
  isTeacher: {
    type: Sequelize.VIRTUAL,
    get() {
      return this.userType === 'TEACHER'
    }
  }
});

User.findUnassignedStudents = async function() {
  const users = await User.findAll({
    where: {
      mentorId: null,
      userType: 'STUDENT'
    }
  });
  return users;
}

User.findTeachersAndMentees = async function() {
  const teachers = await User.findAll({
    where: {
      userType: 'TEACHER'
    },
    include: {
      model: User,
      as: 'mentees'
    }
  });
  return teachers;
}

// beforeUpdate hooks
User.beforeUpdate(async user => {
  // logic for updating mentor
  const newMentor = await User.findByPk(user.mentorId);
  if (newMentor !== null) {
    if (newMentor.userType === 'STUDENT') {
      throw new Error('Cannot set a STUDENT as a mentor')
    }
  }
  // logic for updating userType student -> teacher
  if (user._previousDataValues.userType === 'STUDENT' &&
      user.userType === 'TEACHER' && user.mentorId !== null) 
      {
     throw new Error('Cannot change userType from STUDENT to TEACHER if user has a mentor')
  }
  // logic for updating userType teacher -> student
  if (user._previousDataValues.userType === 'TEACHER' &&
      user.userType === 'STUDENT') {
    const userWithMentees = await User.findByPk(user.id, 
      {include: {
        model: User,
        as: 'mentees'
    }})
    if (userWithMentees.mentees.length > 0) {
      throw new Error('Cannot change userType from TEACHER to STUDENT if user has mentees')
    }
  }
})

User.prototype.getPeers = async function() {
  const users = await User.findAll({
    where: {
      mentorId: this.mentorId,
      name: {
        [Op.ne]: this.name
      }
    }
  })
  return users;
}

/**
 * We've created the association for you!
 *
 * A user can be related to another user as a mentor:
 *       SALLY (mentor)
 *         |
 *       /   \
 *     MOE   WANDA
 * (mentee)  (mentee)
 *
 * You can find the mentor of a user by the mentorId field
 * In Sequelize, you can also use the magic method getMentor()
 * You can find a user's mentees with the magic method getMentees()
 */

User.belongsTo(User, { as: 'mentor' });
User.hasMany(User, { as: 'mentees', foreignKey: 'mentorId' });

module.exports = User;
