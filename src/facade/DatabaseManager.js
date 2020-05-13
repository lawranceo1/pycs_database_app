import * as firebase from 'firebase/app';
import 'firebase/firestore';
import Controller from './Controller';

const FieldValue = firebase.firestore.FieldValue;
const Timestamp = firebase.firestore.Timestamp;

const STATUS = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  deleted: 'Deleted',
};

// TODO: converter, query, order, limit, paging, indices, cached

export default class DatabaseManager {
  static instance;

  /**
   * Get an instance of DatabaseManager.
   * @returns {DatabaseManager}
   *  Instance of DatabaseManager
   */
  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  constructor() {
    if (DatabaseManager.instance) {
      throw new Error('DatabaseManager is a singleton class');
    }

    this.db = firebase.firestore();
    this.permanentRef = this.db.collection('permanent');
    this.newRef = this.db.collection('new');
    this.statRef = this.db.collection('statistics').doc('participant');
  }

  /**
   * Private helper method to get single document
   */
  _getSingleParticipant(ref, docId, onNext, onError) {
    return ref.doc(docId).onSnapshot({
      next: docSnap => {
        let doc = docSnap.data();
        if (doc) {
          onNext(doc);
          return;
        }

        if (onError) {
          onError(new Error('Document does not exist'));
        }
      },
      error: onError,
    });
  }

  /**
   * Add a new participant document into new collection.
   * @param {participant: Object}
   *  Object containing participant info
   * @param {onSuccess?: (docId: string) => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  addNew(participant, onSuccess, onError) {
    let document = Object.assign({}, participant, {
      status: STATUS.pending,
      createdAt: FieldValue.serverTimestamp(),
      history: FieldValue.arrayUnion({
        user: 'System',
        event: 'Received registration data from participant.',
        timestamp: Timestamp.now(),
      }),
    });

    let docRef = this.newRef.doc();

    let batch = this.db.batch();
    batch.set(docRef, document);
    batch.update(this.statRef, { numOfNew: FieldValue.increment(1) });
    batch
      .commit()
      .then(() => {
        if (onSuccess) {
          onSuccess(docRef.id);
        }
      })
      .catch(onError);
  }

  /**
   * Get a participant document from new collection.
   * @param {docId: string}
   *  Document id
   * @param {onNext: (doc: Object) => void}
   *  Callback function when document changes
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   * @returns {() => void}
   *  Unsubscribe function
   */
  getNew(docId, onNext, onError) {
    return this._getSingleParticipant(this.newRef, docId, onNext, onError);
  }

  /**
   * Update a participant document in new collection.
   * @param {docId: string}
   *  Document id
   * @param {data: Object}
   *  Object containing updated values
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  updateNew(docId, data, onSuccess, onError) {
    let document = Object.assign({}, data, {
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Updated',
        timestamp: Timestamp.now(),
      }),
    });

    this.newRef
      .doc(docId)
      .update(document)
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Delete a participant document from new collection.
   * @param {docId: string}
   *  Document id
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  deleteNew(docId, onSuccess, onError) {
    let docRef = this.newRef.doc(docId);
    let batch = this.db.batch();

    batch.delete(docRef);
    batch.update(this.statRef, { numOfNew: FieldValue.increment(-1) });
    batch
      .commit()
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Add a new participant document into permanent collection.
   * @param {participant: Object}
   *  Object containing participant info
   * @param {onSuccess?: (docId: string) => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  addPermanent(participant, onSuccess, onError) {
    let document = Object.assign({}, participant, {
      status: STATUS.pending,
      createdAt: FieldValue.serverTimestamp(),
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Created',
        timestamp: Timestamp.now(),
      }),
    });

    this.permanentRef
      .add(document)
      .then(docRef => {
        if (onSuccess) {
          // Could use docRef.data() to get doc content instead
          onSuccess(docRef.id);
        }
      })
      .catch(onError);
  }

  /**
   * Get a participant document from permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {onNext: (doc: Object) => void}
   *  Callback function when document changes
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   * @returns {() => void}
   *  Unsubscribe function
   */
  getPermanent(docId, onNext, onError) {
    let ref = this.permanentRef;
    return this._getSingleParticipant(ref, docId, onNext, onError);
  }

  /**
   * Update a participant document in permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {data: Object}
   *  Object containing updated values
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  updatePermanent(docId, data, onSuccess, onError) {
    let document = Object.assign({}, data, {
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Updated',
        timestamp: Timestamp.now(),
      }),
    });

    this.permanentRef
      .doc(docId)
      .update(document)
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Delete a participant document from permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  deletePermanent(docId, onSuccess, onError) {
    let document = {
      status: STATUS.deleted,
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Deleted',
        timestamp: Timestamp.now(),
      }),
    };

    this.permanentRef
      .doc(docId)
      .update(document)
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Undo deleting a participant document from permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  undoDeletePermanent(docId, onSuccess, onError) {
    let document = {
      // TODO: revert back to old state
      status: STATUS.pending,
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Undid deleting',
        timestamp: Timestamp.now(),
      }),
    };

    this.permanentRef
      .doc(docId)
      .update(document)
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Move a document in new collection to permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {onSuccess?: (docId: string) => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  moveToPermanent(docId, onSuccess, onError) {
    let oldDocRef = this.newRef.doc(docId);
    let newDocRef = this.permanentRef.doc(); // put docId in to keep same ID
    let updateFunction = transaction => {
      return transaction.get(oldDocRef).then(docSnap => {
        let doc = docSnap.data();
        if (!doc) {
          throw new Error('Document does not exist');
        }

        doc.status = STATUS.pending;
        doc.history.push({
          user: 'TODO',
          event: 'TODO: Moved',
          timestamp: Timestamp.now(),
        });

        transaction.set(newDocRef, doc);
        transaction.delete(oldDocRef);
      });
    };

    return this.db
      .runTransaction(updateFunction)
      .then(() => {
        if (onSuccess) {
          onSuccess(newDocRef.id);
        }
      })
      .catch(onError);
  }

  /**
   * Approve a pending document in permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  approvePending(docId, onSuccess, onError) {
    let document = {
      status: STATUS.approved,
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Approved',
        timestamp: Timestamp.now(),
      }),
    };

    this.permanentRef
      .doc(docId)
      .update(document)
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Decline a pending document in permanent collection.
   * @param {docId: string}
   *  Document id
   * @param {onSuccess?: () => void}
   *  Callback function when success
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   */
  declinePending(docId, onSuccess, onError) {
    let document = {
      status: STATUS.declined,
      history: FieldValue.arrayUnion({
        user: 'TODO',
        event: 'TODO: Declined',
        timestamp: Timestamp.now(),
      }),
    };

    this.permanentRef
      .doc(docId)
      .update(document)
      .then(onSuccess)
      .catch(onError);
  }

  /**
   * Get all participant documents from new collection.
   * @param {filter: Object}
   *  Object containing fields and values for filtering
   * @param {sorter: Object}
   *  Object containing fields and orders for sorting
   * @param {limit: number}
   *  Number of documents for a page
   * @param {onChildNext: (doc: Object, newIndex: number,
   *                       oldIndex: number, type: string) => void}
   *  Callback function when document changes in the collection
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   * @returns {Controller}
   *  A controller object
   */
  getNewList(filter, sorter, limit, onChildNext, onError) {
    return new Controller(
      this.newRef,
      filter,
      sorter,
      limit,
      onChildNext,
      onError,
    );
  }

  /**
   * Get all participant documents from permanent collection.
   * @param {filter: Object}
   *  Object containing fields and values for filtering
   * @param {sorter: Object}
   *  Object containing fields and orders for sorting
   * @param {limit: number}
   *  Number of documents for a page
   * @param {onChildNext: (doc: Object, newIndex: number,
   *                       oldIndex: number, type: string) => void}
   *  Callback function when document changes in the collection
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   * @returns {Controller}
   *  A controller object
   */
  getPermanentList(filter, sorter, limit, onChildNext, onError) {
    return new Controller(
      this.permanentRef,
      filter,
      sorter,
      limit,
      onChildNext,
      onError,
    );
  }

  /**
   * Get participant statistical info stored in a firestore document.
   * @param {onNext: (doc: Object) => void}
   *  Callback function when document changes
   * @param {onError?: (error: Error) => void}
   *  Callback function when fail
   * @returns {() => void}
   *  Unsubscribe function
   */
  getStatistics(onNext, onError) {
    return this.statRef.onSnapshot({
      next: docSnap => {
        onNext(docSnap.data());
      },
      error: onError,
    });
  }
}
