// ============================================================
//  INET BOT — SQLite Database (Sequelize)
//  File: utils/database.js
//  Stores: tickets + ticket counter + member timeouts
// ============================================================

const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'INET.db'),
    logging: false,
});

// ─────────────────────────────────────────────────────────────
//  MODEL: Ticket
// ─────────────────────────────────────────────────────────────
const Ticket = sequelize.define('Ticket', {
    channelId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userTag: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ticketNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    claimedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    closedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    closedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'tickets',
    timestamps: true,
});

// ─────────────────────────────────────────────────────────────
//  MODEL: MemberTimeout (For role restoration)
// ─────────────────────────────────────────────────────────────
const MemberTimeout = sequelize.define('MemberTimeout', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    roles: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'member_timeouts',
    timestamps: true,
});

// ─────────────────────────────────────────────────────────────
//  MODEL: TicketCounter (per-guild ticket counter)
// ─────────────────────────────────────────────────────────────
const TicketCounter = sequelize.define('TicketCounter', {
    guildId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    lastNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'ticket_counters',
    timestamps: true,
});

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
async function initDatabase() {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('[DB] INET.db connected and tables synced.');
    return sequelize;
}

async function saveTicket(data) {
    await Ticket.upsert(data);
}

async function getTicket(channelId) {
    return Ticket.findByPk(channelId);
}

async function getOpenTicketByUser(userId) {
    return Ticket.findOne({ where: { userId, closed: false } });
}

async function updateTicket(channelId, updates) {
    await Ticket.update(updates, { where: { channelId } });
}

async function deleteTicket(channelId) {
    await Ticket.destroy({ where: { channelId } });
}

async function getAllOpenTickets() {
    return Ticket.findAll({ where: { closed: false } });
}

async function getAllTickets() {
    return Ticket.findAll();
}

// ─────────────────────────────────────────────────────────────
//  TICKET COUNTER HELPERS
// ─────────────────────────────────────────────────────────────
async function getNextTicketNumber(guildId, startAt = 127) {
    let counter = await TicketCounter.findByPk(guildId);
    if (!counter) {
        counter = await TicketCounter.create({
            guildId: guildId,
            lastNumber: startAt - 1,
        });
    }
    const next = counter.lastNumber + 1;
    counter.lastNumber = next;
    await counter.save();
    return next;
}

async function getCurrentTicketNumber(guildId, startAt = 127) {
    const counter = await TicketCounter.findByPk(guildId);
    if (!counter) return startAt - 1;
    return counter.lastNumber;
}

async function saveMemberTimeout(data) {
    return MemberTimeout.create(data);
}

async function getMemberTimeout(userId, guildId) {
    return MemberTimeout.findOne({ where: { userId, guildId } });
}

async function deleteMemberTimeout(id) {
    return MemberTimeout.destroy({ where: { id } });
}

async function getExpiredTimeouts() {
    return MemberTimeout.findAll({
        where: {
            expiresAt: {
                [Op.lte]: new Date()
            }
        }
    });
}

module.exports = {
    sequelize,
    Ticket,
    TicketCounter,
    initDatabase,
    saveTicket,
    getTicket,
    getOpenTicketByUser,
    updateTicket,
    deleteTicket,
    getAllOpenTickets,
    getAllTickets,
    getNextTicketNumber,
    getCurrentTicketNumber,
    MemberTimeout,
    saveMemberTimeout,
    getMemberTimeout,
    deleteMemberTimeout,
    getExpiredTimeouts,
    Op,
};
