'use strict'

const {
  createError,
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND
} = require('../helpers/error_helper')
const {
  REQUESTED,
  PENDING,
  ACCEPTED,
  DECLINED,
  REJECTED,
  BANNED,
  FRIENDSHIP_STATUSES
} = require('../constants/friendship_status')
const {
  findFriendshipById,
  createMutualFriendships,
  getMutualFriendships,
  changeFriendshipStatus,
  findSentReceivedFriendships
} = require('../helpers/friend_helper')

const getFriendships = (req, res, next) => {
  const { Friendship, User } = req.app.models

  Friendship.findAll({
    where: {
      userId: req.params.user_id
    },
    include: [{
      model: User,
      attributes: ['id', 'username'],
      as: 'friend'
    }]
  })
    .then(friendships => res.json({
      ok: true,
      message: 'Found user friendships',
      friendships
    }))
    .catch(next)
}

const postFriendships = (req, res, next) => {
  const userId = req.params.user_id
  const userIds = req.body.user_ids || []
  const emails = req.body.emails || []
  const usernames = req.body.usernames || []

  createMutualFriendships({
    models: req.app.models,
    userId,
    userIds,
    emails,
    usernames
  })
    .then(friendships => res.json({
      ok: true,
      message: 'User friendships created',
      friendships
    }))
    .catch(next)
}

const getFriendship = (req, res, next) => {
  const { Friendship } = req.app.models
  const friendshipId = req.params.friendship_id

  findFriendshipById(Friendship, friendshipId)
    .then(friendship => res.json({
      ok: true,
      message: 'Friendship found',
      friendship
    }))
    .catch(next)
}

const deleteFriendship = (req, res, next) => {
  const { Friendship } = req.app.models

  Friendship.findOne({
    where: {
      userId: req.params.user_id,
      friendId: req.params.friend_id
    }
  })
    .then(friendship => friendship.update({ status: REJECTED }))
    .then(() => res.json({
      ok: true,
      message: 'Friendship rejected'
    }))
    .catch(next)
}

const deleteFriendships = (req, res, next) => {
  const { Friendship } = req.app.models

  Friendship.findAll({
    where: {
      userId: req.params.user_id,
      friendId: { $or: req.body.userIds }
    }
  })
    .then(friendships => friendship.update({ status: REJECTED }, {
      where: { id: friendships.map(f => f.id) }
    }))
    .then(friendships => res.json({
      ok: true,
      message: 'Friendships rejected.',
      friendships
    }))
    .catch(next)
}

const updateFriendshipStatus = newStatus => (req, res, next) => {
  const userId = req.params.user_id
  const friendId = req.params.friend_id

  changeFriendshipStatus(req.app.models, userId, friendId, newStatus)
    .then(friendship => res.json({
      ok: true,
      message: `Friendship status updated to '${ newStatus }'`,
      friendship
    }))
    .catch(next)
}

module.exports = {
  getFriendships,
  postFriendships,
  deleteFriendships,
  getFriendship,
  deleteFriendship,
  updateFriendshipStatus
}
