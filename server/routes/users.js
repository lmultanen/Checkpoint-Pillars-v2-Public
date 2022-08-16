const router = require('express').Router();
const {
  models: { User },
} = require('../db');

/**
 * All of the routes in this are mounted on /api/users
 * For instance:
 *
 * router.get('/hello', () => {...})
 *
 * would be accessible on the browser at http://localhost:3000/api/users/hello
 *
 * These route tests depend on the User Sequelize Model tests. However, it is
 * possible to pass the bulk of these tests after having properly configured
 * the User model's name and userType fields.
 */

// Add your routes here:
router.get('/unassigned', async (req,res,next) => {
  try {
    const unassigned = await User.findUnassignedStudents();
    res.send(unassigned);
  } catch (error) {
    next(error);
  }
})

router.get('/teachers', async (req,res,next) => {
  try {
    const teachers = await User.findTeachersAndMentees();
    res.send(teachers);
  } catch (error) {
    next(error);
  }
})

//name querying
router.get('/', async (req,res,next) => {
  try {
    //want to make sure we are case-insensitive
    const name = req.query['name'].toLowerCase();
    if (name) {
      console.log('name string:', name)
      const users = await User.findAll();
      let filteredUsers = users.filter(user => user.name.toLowerCase().includes(name))
      res.send(filteredUsers)
    }
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req,res,next) => {
  try {
    let id = Number(req.params.id);
    if (!id) {
      res.status(400).send('400 Error: Not valid user id')
    }
    const user = await User.findByPk(id);
    if (user === null) {
      res.status(404).send('404 Error: User does not exist');
    }
    await user.destroy();
    res.status(204).send('User deleted')
  } catch (error) {
    next(error);
  }
})

router.put('/:id', async (req,res,next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      res.status(404).send('404 Error: User does not exist')
    }
    await user.update(req.body)
    res.send(user);
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req,res,next) => {
  try {
    const [newUser, created] = await User.findOrCreate({
      where: req.body});
    if (!created) {
      res.status(409).send('User name already taken');
    }
    res.status(201).send(newUser);
  } catch (error) {
    next(error);
  }
})

module.exports = router;
