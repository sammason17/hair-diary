import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// Mock the mongodb module before importing
jest.mock('../mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
    }),
  }),
}));

describe('db.ts - In-Memory Database', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };

    // Ensure we're in in-memory mode
    process.env.USE_REAL_DB = 'false';

    // Clear module cache to reset in-memory database
    jest.resetModules();

    // Reset the global in-memory database
    const { resetInMemoryDB } = await import('../db');
    resetInMemoryDB();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getDb() - In-Memory Mode', () => {
    it('should return in-memory database when USE_REAL_DB is false', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();

      expect(db).toBeDefined();
      expect(db.collection).toBeDefined();
      expect(typeof db.collection).toBe('function');
    });

    it('should return in-memory database when USE_REAL_DB is undefined', async () => {
      delete process.env.USE_REAL_DB;

      const { getDb } = await import('../db');
      const db = await getDb();

      expect(db).toBeDefined();
      expect(db.collection).toBeDefined();
    });
  });

  describe('Users Collection - Initial State', () => {
    it('should have pre-seeded users', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const users = await usersCollection.find().toArray();

      expect(users).toHaveLength(2);
      expect(users[0]).toMatchObject({
        username: 'stewart',
        name: 'Stewart',
      });
      expect(users[0].passwordHash).toBeDefined();
      expect(users[0]._id).toBeDefined();
      expect(users[0]._id.constructor.name).toBe('ObjectId');

      expect(users[1]).toMatchObject({
        username: 'sue',
        name: 'Sue',
      });
      expect(users[1].passwordHash).toBeDefined();
      expect(users[1]._id).toBeDefined();
      expect(users[1]._id.constructor.name).toBe('ObjectId');
    });

    it('should have valid bcrypt password hashes', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const users = await usersCollection.find().toArray();

      // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
      expect(users[0].passwordHash).toMatch(/^\$2[aby]\$\d+\$/);
      expect(users[0].passwordHash).toHaveLength(60);

      expect(users[1].passwordHash).toMatch(/^\$2[aby]\$\d+\$/);
      expect(users[1].passwordHash).toHaveLength(60);
    });

    it('should have functional bcrypt password hashes that work with "password"', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const users = await usersCollection.find().toArray();

      // Mock database uses "password" for both users - verify it works
      const stewartUser = users.find(u => u.username === 'stewart');
      const sueUser = users.find(u => u.username === 'sue');

      expect(stewartUser).toBeDefined();
      expect(sueUser).toBeDefined();

      // Test that "password" works with both user hashes
      const stewartPasswordValid = await bcrypt.compare('password', stewartUser!.passwordHash);
      expect(stewartPasswordValid).toBe(true);

      const suePasswordValid = await bcrypt.compare('password', sueUser!.passwordHash);
      expect(suePasswordValid).toBe(true);

      // Test that wrong password fails
      const stewartWrongPassword = await bcrypt.compare('wrongpassword', stewartUser!.passwordHash);
      expect(stewartWrongPassword).toBe(false);

      const sueWrongPassword = await bcrypt.compare('wrongpassword', sueUser!.passwordHash);
      expect(sueWrongPassword).toBe(false);
    });
  });

  describe('Appointments Collection - Initial State', () => {
    it('should start with empty appointments array', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const appointments = await appointmentsCollection.find().toArray();

      expect(appointments).toEqual([]);
      expect(appointments).toHaveLength(0);
    });
  });

  describe('find() - Query Operations', () => {
    it('should return all documents when query is empty', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const allUsers = await usersCollection.find({}).toArray();
      const allUsersNoQuery = await usersCollection.find().toArray();

      expect(allUsers).toHaveLength(2);
      expect(allUsersNoQuery).toHaveLength(2);
      expect(allUsers).toEqual(allUsersNoQuery);
    });

    it('should filter by string field', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const stewartUsers = await usersCollection.find({ username: 'stewart' }).toArray();

      expect(stewartUsers).toHaveLength(1);
      expect(stewartUsers[0].username).toBe('stewart');
    });

    it('should filter by ObjectId', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const allUsers = await usersCollection.find().toArray();
      const stewartId = allUsers[0]._id;

      const foundUsers = await usersCollection.find({ _id: stewartId }).toArray();

      expect(foundUsers).toHaveLength(1);
      expect(foundUsers[0]._id.toString()).toBe(stewartId.toString());
    });

    it('should filter by ObjectId in appointments collection', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      // Insert a test appointment
      const testAppointment = {
        date: '2026-03-15',
        startTime: '10:00',
        endTime: '11:00',
        column: 'stewart',
        clientName: 'Test Client'
      };

      const insertResult = await appointmentsCollection.insertOne(testAppointment);
      const insertedId = insertResult.insertedId;

      // Now find it using the ObjectId in a query
      const foundAppointments = await appointmentsCollection.find({ _id: insertedId }).toArray();

      expect(foundAppointments).toHaveLength(1);
      expect(foundAppointments[0].clientName).toBe('Test Client');
      expect(foundAppointments[0]._id.toString()).toBe(insertedId.toString());
    });

    it('should return empty array when no match found', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const result = await usersCollection.find({ username: 'nonexistent' }).toArray();

      expect(result).toEqual([]);
    });

    it('should filter by multiple fields', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const result = await usersCollection.find({ username: 'stewart', name: 'Stewart' }).toArray();

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('stewart');
      expect(result[0].name).toBe('Stewart');
    });

    it('should return empty array when querying nonexistent collection', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const nonexistentCollection = db.collection('nonexistent');

      const result = await nonexistentCollection.find().toArray();

      expect(result).toEqual([]);
    });
  });

  describe('findOne() - Single Document Query', () => {
    it('should find user by username', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const stewart = await usersCollection.findOne({ username: 'stewart' });

      expect(stewart).toBeDefined();
      expect(stewart?.username).toBe('stewart');
      expect(stewart?.name).toBe('Stewart');
    });

    it('should find user by ObjectId', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const allUsers = await usersCollection.find().toArray();
      const stewartId = allUsers[0]._id;

      const found = await usersCollection.findOne({ _id: stewartId });

      expect(found).toBeDefined();
      expect(found?._id.toString()).toBe(stewartId.toString());
    });

    it('should return undefined when no match found', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const result = await usersCollection.findOne({ username: 'nonexistent' });

      expect(result).toBeUndefined();
    });

    it('should filter by multiple fields', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const usersCollection = db.collection('users');

      const result = await usersCollection.findOne({ username: 'sue', name: 'Sue' });

      expect(result).toBeDefined();
      expect(result?.username).toBe('sue');
      expect(result?.name).toBe('Sue');
    });

    it('should return undefined for nonexistent collection', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const nonexistentCollection = db.collection('nonexistent');

      const result = await nonexistentCollection.findOne({ key: 'value' });

      expect(result).toBeUndefined();
    });
  });

  describe('insertOne() - Create Operations', () => {
    it('should insert new appointment', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const newAppointment = {
        date: '2026-03-15',
        startTime: '10:00',
        endTime: '11:00',
        column: 'stewart',
        clientName: 'John Doe',
        phone: '555-1234',
      };

      const result = await appointmentsCollection.insertOne(newAppointment);

      expect(result.insertedId).toBeDefined();
      expect(result.insertedId.constructor.name).toBe('ObjectId');

      const found = await appointmentsCollection.findOne({ _id: result.insertedId });
      expect(found).toMatchObject(newAppointment);
      expect(found?._id).toEqual(result.insertedId);
    });

    it('should insert multiple appointments sequentially', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const appointment1 = {
        date: '2026-03-15',
        startTime: '10:00',
        endTime: '11:00',
        column: 'stewart',
        clientName: 'John Doe',
      };

      const appointment2 = {
        date: '2026-03-15',
        startTime: '14:00',
        endTime: '15:00',
        column: 'sue',
        clientName: 'Jane Smith',
      };

      await appointmentsCollection.insertOne(appointment1);
      await appointmentsCollection.insertOne(appointment2);

      const all = await appointmentsCollection.find().toArray();
      expect(all).toHaveLength(2);
    });

    it('should auto-generate ObjectId for new document', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const result = await appointmentsCollection.insertOne({ test: 'data' });

      expect(result.insertedId).toBeDefined();
      expect(result.insertedId.constructor.name).toBe('ObjectId');

      const found = await appointmentsCollection.findOne({ _id: result.insertedId });
      expect(found?._id).toEqual(result.insertedId);
    });
  });

  describe('updateOne() - Update Operations', () => {
    it('should update existing appointment', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const newAppointment = {
        date: '2026-03-15',
        startTime: '10:00',
        endTime: '11:00',
        column: 'stewart',
        clientName: 'John Doe',
      };

      const { insertedId } = await appointmentsCollection.insertOne(newAppointment);

      const updateResult = await appointmentsCollection.updateOne(
        { _id: insertedId },
        { $set: { clientName: 'John Smith', phone: '555-9999' } }
      );

      expect(updateResult.modifiedCount).toBe(1);

      const updated = await appointmentsCollection.findOne({ _id: insertedId });
      expect(updated?.clientName).toBe('John Smith');
      expect(updated?.phone).toBe('555-9999');
      expect(updated?.date).toBe('2026-03-15'); // Other fields preserved
    });

    it('should update by string field query', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      await appointmentsCollection.insertOne({
        date: '2026-03-15',
        clientName: 'Original Name',
      });

      const updateResult = await appointmentsCollection.updateOne(
        { date: '2026-03-15' },
        { $set: { clientName: 'Updated Name' } }
      );

      expect(updateResult.modifiedCount).toBe(1);

      const updated = await appointmentsCollection.findOne({ date: '2026-03-15' });
      expect(updated?.clientName).toBe('Updated Name');
    });

    it('should return modifiedCount 0 when document not found', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const updateResult = await appointmentsCollection.updateOne(
        { _id: new ObjectId() },
        { $set: { clientName: 'Should Not Update' } }
      );

      expect(updateResult.modifiedCount).toBe(0);
    });

    it('should update multiple fields at once', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const { insertedId } = await appointmentsCollection.insertOne({
        date: '2026-03-15',
        startTime: '10:00',
        endTime: '11:00',
      });

      await appointmentsCollection.updateOne(
        { _id: insertedId },
        { $set: { startTime: '11:00', endTime: '12:00', column: 'sue' } }
      );

      const updated = await appointmentsCollection.findOne({ _id: insertedId });
      expect(updated?.startTime).toBe('11:00');
      expect(updated?.endTime).toBe('12:00');
      expect(updated?.column).toBe('sue');
    });

    it('should preserve _id when updating', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const { insertedId } = await appointmentsCollection.insertOne({ test: 'original' });
      const originalIdString = insertedId.toString();

      await appointmentsCollection.updateOne(
        { _id: insertedId },
        { $set: { test: 'updated' } }
      );

      const updated = await appointmentsCollection.findOne({ _id: insertedId });
      expect(updated?._id.toString()).toBe(originalIdString);
    });

    it('should not update when $set is missing', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const { insertedId } = await appointmentsCollection.insertOne({ test: 'original' });

      // Update without $set should not modify
      const updateResult = await appointmentsCollection.updateOne(
        { _id: insertedId },
        { notSet: 'value' } as any
      );

      // The document should not be modified when $set is not provided
      const doc = await appointmentsCollection.findOne({ _id: insertedId });
      expect(doc?.test).toBe('original');
      expect(doc?.notSet).toBeUndefined();
    });

    it('should handle updateOne on nonexistent collection', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const nonexistentCollection = db.collection('nonexistent');

      const updateResult = await nonexistentCollection.updateOne(
        { _id: new ObjectId() },
        { $set: { test: 'value' } }
      );

      expect(updateResult.modifiedCount).toBe(0);
    });
  });

  describe('deleteOne() - Delete Operations', () => {
    it('should delete existing appointment', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const { insertedId } = await appointmentsCollection.insertOne({
        date: '2026-03-15',
        clientName: 'To Delete',
      });

      const deleteResult = await appointmentsCollection.deleteOne({ _id: insertedId });

      expect(deleteResult.deletedCount).toBe(1);

      const found = await appointmentsCollection.findOne({ _id: insertedId });
      expect(found).toBeUndefined();
    });

    it('should delete by string field query', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      await appointmentsCollection.insertOne({
        date: '2026-03-15',
        clientName: 'To Delete',
      });

      const deleteResult = await appointmentsCollection.deleteOne({ date: '2026-03-15' });

      expect(deleteResult.deletedCount).toBe(1);

      const all = await appointmentsCollection.find().toArray();
      expect(all).toHaveLength(0);
    });

    it('should return deletedCount 0 when document not found', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const deleteResult = await appointmentsCollection.deleteOne({ _id: new ObjectId() });

      expect(deleteResult.deletedCount).toBe(0);
    });

    it('should only delete first matching document', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      await appointmentsCollection.insertOne({ date: '2026-03-15', clientName: 'Client 1' });
      await appointmentsCollection.insertOne({ date: '2026-03-15', clientName: 'Client 2' });

      const deleteResult = await appointmentsCollection.deleteOne({ date: '2026-03-15' });

      expect(deleteResult.deletedCount).toBe(1);

      const remaining = await appointmentsCollection.find({ date: '2026-03-15' }).toArray();
      expect(remaining).toHaveLength(1);
    });

    it('should handle multiple sequential deletes', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const { insertedId: id1 } = await appointmentsCollection.insertOne({ test: '1' });
      const { insertedId: id2 } = await appointmentsCollection.insertOne({ test: '2' });

      await appointmentsCollection.deleteOne({ _id: id1 });
      await appointmentsCollection.deleteOne({ _id: id2 });

      const all = await appointmentsCollection.find().toArray();
      expect(all).toHaveLength(0);
    });

    it('should handle deleteOne on nonexistent collection', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const nonexistentCollection = db.collection('nonexistent');

      const deleteResult = await nonexistentCollection.deleteOne({ _id: new ObjectId() });

      expect(deleteResult.deletedCount).toBe(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle CRUD operations on appointments', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      // Create
      const { insertedId } = await appointmentsCollection.insertOne({
        date: '2026-03-15',
        startTime: '10:00',
        endTime: '11:00',
        column: 'stewart',
        clientName: 'Test Client',
      });

      // Read
      let appointment = await appointmentsCollection.findOne({ _id: insertedId });
      expect(appointment?.clientName).toBe('Test Client');

      // Update
      await appointmentsCollection.updateOne(
        { _id: insertedId },
        { $set: { clientName: 'Updated Client' } }
      );

      appointment = await appointmentsCollection.findOne({ _id: insertedId });
      expect(appointment?.clientName).toBe('Updated Client');

      // Delete
      await appointmentsCollection.deleteOne({ _id: insertedId });

      appointment = await appointmentsCollection.findOne({ _id: insertedId });
      expect(appointment).toBeUndefined();
    });

    it('should maintain separate data for different collections', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();

      const usersCollection = db.collection('users');
      const appointmentsCollection = db.collection('appointments');

      const users = await usersCollection.find().toArray();
      const appointments = await appointmentsCollection.find().toArray();

      expect(users).toHaveLength(2);
      expect(appointments).toHaveLength(0);

      await appointmentsCollection.insertOne({ test: 'appointment' });

      const usersAfter = await usersCollection.find().toArray();
      const appointmentsAfter = await appointmentsCollection.find().toArray();

      expect(usersAfter).toHaveLength(2);
      expect(appointmentsAfter).toHaveLength(1);
    });

    it('should handle ObjectId comparison correctly', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      const appointmentsCollection = db.collection('appointments');

      const { insertedId: id1 } = await appointmentsCollection.insertOne({ name: 'First' });
      const { insertedId: id2 } = await appointmentsCollection.insertOne({ name: 'Second' });

      // Find by exact ObjectId match
      const found1 = await appointmentsCollection.findOne({ _id: id1 });
      expect(found1?.name).toBe('First');

      const found2 = await appointmentsCollection.findOne({ _id: id2 });
      expect(found2?.name).toBe('Second');

      // Should not find with different ObjectId
      const notFound = await appointmentsCollection.findOne({ _id: new ObjectId() });
      expect(notFound).toBeUndefined();
    });
  });
});

describe('db.ts - MongoDB Mode', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.USE_REAL_DB = 'true';
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
    process.env.MONGODB_DB = 'test-db';

    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getDb() - MongoDB Mode', () => {
    it('should return MongoDB client when USE_REAL_DB is true', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();

      expect(db).toBeDefined();
      expect(db.collection).toBeDefined();
    });

    it('should use default database name when MONGODB_DB is not set', async () => {
      delete process.env.MONGODB_DB;

      const { getDb } = await import('../db');
      const db = await getDb();

      expect(db).toBeDefined();
      expect(db.collection).toBeDefined();
    });
  });
});
