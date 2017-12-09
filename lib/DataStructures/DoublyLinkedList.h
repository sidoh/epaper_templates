/*
  ********* Adapted from: *********
  https://github.com/ivanseidel/DoublyLinkedList
  Created by Ivan Seidel Gomes, March, 2013.
  Released into the public domain.
  *********************************

  Changes:
    - public access to DoublyLinkedListNode (allows for splicing for LRU)
    - doubly-linked
    - remove caching stuff in favor of standard linked list iterating
    - remove sorting
*/

#ifndef _DOUBLY_LINKED_LIST_H
#define _DOUBLY_LINKED_LIST_H

#include <stddef.h>

template<class T>
struct DoublyLinkedListNode {
  T data;
  DoublyLinkedListNode<T> *next;
  DoublyLinkedListNode<T> *prev;
};

template <typename T>
class DoublyLinkedList {

protected:
  int _size;
  DoublyLinkedListNode<T> *root;
  DoublyLinkedListNode<T>  *last;

public:
  DoublyLinkedList();
  ~DoublyLinkedList();

  /*
    Returns current size of DoublyLinkedList
  */
  virtual int size() const;
  /*
    Adds a T object in the specified index;
    Unlink and link the DoublyLinkedList correcly;
    Increment _size
  */
  virtual bool add(int index, T);
  /*
    Adds a T object in the end of the DoublyLinkedList;
    Increment _size;
  */
  virtual bool add(T);
  /*
    Adds a T object in the start of the DoublyLinkedList;
    Increment _size;
  */
  virtual bool unshift(T);
  /*
    Set the object at index, with T;
    Increment _size;
  */
  virtual bool set(int index, T);
  /*
    Remove object at index;
    If index is not reachable, returns false;
    else, decrement _size
  */
  virtual T remove(int index);
  /*
    Remove last object;
  */
  virtual T pop();
  /*
    Remove first object;
  */
  virtual T shift();
  /*
    Get the index'th element on the list;
    Return Element if accessible,
    else, return false;
  */
  virtual T get(int index);

  /*
    Clear the entire array
  */
  virtual void clear();

  DoublyLinkedListNode<T>* getNode(int index);
  virtual void spliceToFront(DoublyLinkedListNode<T>* node);
  DoublyLinkedListNode<T>* getHead() { return root; }
  DoublyLinkedListNode<T>* getTail() { return last; }
  T getLast() const { return last == NULL ? T() : last->data; }

};


template<typename T>
void DoublyLinkedList<T>::spliceToFront(DoublyLinkedListNode<T>* node) {
  // Node is already root
  if (node->prev == NULL) {
    return;
  }

  node->prev->next = node->next;
  if (node->next != NULL) {
    node->next->prev = node->prev;
  } else {
    last = node->prev;
  }

  root->prev = node;
  node->next = root;
  node->prev = NULL;
  root = node;
}

// Initialize DoublyLinkedList with false values
template<typename T>
DoublyLinkedList<T>::DoublyLinkedList()
{
  root=NULL;
  last=NULL;
  _size=0;
}

// Clear Nodes and free Memory
template<typename T>
DoublyLinkedList<T>::~DoublyLinkedList()
{
  DoublyLinkedListNode<T>* tmp;
  while(root!=NULL)
  {
    tmp=root;
    root=root->next;
    delete tmp;
  }
  last = NULL;
  _size=0;
}

/*
  Actualy "logic" coding
*/

template<typename T>
DoublyLinkedListNode<T>* DoublyLinkedList<T>::getNode(int index){

  int _pos = 0;
  DoublyLinkedListNode<T>* current = root;

  while(_pos < index && current){
    current = current->next;

    _pos++;
  }

  return NULL;
}

template<typename T>
int DoublyLinkedList<T>::size() const{
  return _size;
}

template<typename T>
bool DoublyLinkedList<T>::add(int index, T _t){

  if(index >= _size)
    return add(_t);

  if(index == 0)
    return unshift(_t);

  DoublyLinkedListNode<T> *tmp = new DoublyLinkedListNode<T>();
  DoublyLinkedListNode<T> *_prev = getNode(index-1);
  tmp->data = _t;
  tmp->next = _prev->next;
  _prev->next = tmp;

  _size++;

  return true;
}

template<typename T>
bool DoublyLinkedList<T>::add(T _t){

  DoublyLinkedListNode<T> *tmp = new DoublyLinkedListNode<T>();
  tmp->data = _t;
  tmp->next = NULL;

  if(root){
    // Already have elements inserted
    last->next = tmp;
    last = tmp;
  }else{
    // First element being inserted
    root = tmp;
    last = tmp;
  }

  _size++;

  return true;
}

template<typename T>
bool DoublyLinkedList<T>::unshift(T _t){

  if(_size == 0)
    return add(_t);

  DoublyLinkedListNode<T> *tmp = new DoublyLinkedListNode<T>();
  tmp->next = root;
  root->prev = tmp;
  tmp->data = _t;
  root = tmp;

  _size++;

  return true;
}

template<typename T>
bool DoublyLinkedList<T>::set(int index, T _t){
  // Check if index position is in bounds
  if(index < 0 || index >= _size)
    return false;

  getNode(index)->data = _t;
  return true;
}

template<typename T>
T DoublyLinkedList<T>::pop(){
  if(_size <= 0)
    return T();

  if(_size >= 2){
    DoublyLinkedListNode<T> *tmp = last->prev;
    T ret = tmp->next->data;
    delete(tmp->next);
    tmp->next = NULL;
    last = tmp;
    _size--;
    return ret;
  }else{
    // Only one element left on the list
    T ret = root->data;
    delete(root);
    root = NULL;
    last = NULL;
    _size = 0;
    return ret;
  }
}

template<typename T>
T DoublyLinkedList<T>::shift(){
  if(_size <= 0)
    return T();

  if(_size > 1){
    DoublyLinkedListNode<T> *_next = root->next;
    T ret = root->data;
    delete(root);
    root = _next;
    _size --;

    return ret;
  }else{
    // Only one left, then pop()
    return pop();
  }

}

template<typename T>
T DoublyLinkedList<T>::remove(int index){
  if (index < 0 || index >= _size)
  {
    return T();
  }

  if(index == 0)
    return shift();

  if (index == _size-1)
  {
    return pop();
  }

  DoublyLinkedListNode<T> *tmp = getNode(index - 1);
  DoublyLinkedListNode<T> *toDelete = tmp->next;
  T ret = toDelete->data;
  tmp->next = tmp->next->next;
  delete(toDelete);
  _size--;
  return ret;
}


template<typename T>
T DoublyLinkedList<T>::get(int index){
  DoublyLinkedListNode<T> *tmp = getNode(index);

  return (tmp ? tmp->data : T());
}

template<typename T>
void DoublyLinkedList<T>::clear(){
  while(size() > 0)
    shift();
}
#endif
