export default function(parent, a, b, afterNode) {
  const a_index = new Map();
  const b_index = new Map();

  let need_indices;
  let start_i = 0;
  let end_i = a.length - 1;
  let start_j = 0;
  let end_j = b.length - 1;
  let start_a = a[start_i];
  let end_a = a[end_i];
  let start_b = b[start_j];
  let end_b = b[end_j];
  let old_start_j;
  let new_start_i;

  while (start_i <= end_i && start_j <= end_j) {
    if (start_a == null) {
      start_a = a[++start_i];
    } else if (end_a == null) {
      end_a = a[--end_i];
    } else if (start_b == null) {
      start_b = b[++start_j];
    } else if (end_b == null) {
      end_b = b[--end_j];
    } else if (start_a === start_b) {
      start_a = a[++start_i];
      start_b = b[++start_j];
    } else if (end_a === end_b) {
      end_a = a[--end_i];
      end_b = b[--end_j];
    }
    else if (start_a === end_b) {
      parent.insertBefore(
        a[start_i],
        a[end_i].nextSibling || afterNode
      );
      start_a = a[++start_i];
      end_b = b[--end_j];
    } else if (end_a === start_b) {
      parent.insertBefore(
        a[end_i],
        a[start_i] || afterNode
      );
      end_a = a[--end_i];
      start_b = b[++start_j];
    }
    else {
      let i;
      // Lazily build maps here. They are relevant only if there has been
      // a move, or a mid-list insertion or deletion and not if there
      // has been an insertion at the end or deletion from the front.
      if (!need_indices) {
        need_indices = true;

        // Create a mapping from keys to their position in the old list
        for (i = 0; i < a.length; i++) {
          a_index.set(a[i], i);
        }
        // Create a mapping from keys to their position in the new list
        for (i = 0; i < b.length; i++) {
          b_index.set(b[i], i);
        }
      }

      old_start_j = a_index.get(start_b);
      new_start_i = b_index.get(start_a);

      // Replacement
      // If considered on its own (with no other fine-grained update method)
      // this is still slower than virtual dom libraries in the general case
      // because it doesn't recursively diff and patch the replaced node.
      if (old_start_j === undefined && new_start_i === undefined) {
        parent.replaceChild(
          start_b,
          a[start_i] // old
        );
        start_a = a[++start_i];
        start_b = b[++start_j];
      }
      // Insertion
      else if (old_start_j === undefined) {
        parent.insertBefore(
          start_b,
          a[start_i] || afterNode
        );
        start_b = b[++start_j];
      }
      // Deletion
      else if (new_start_i === undefined) {
        parent.removeChild(start_a);
        start_a = a[++start_i];
      }
      // Move
      else {
        parent.insertBefore(
          start_b,
          a[start_i] || afterNode
        );
        a[old_start_j] = null;
        start_b = b[++start_j];
      }
    }
  }
  if (start_i <= end_i || start_j <= end_j) {
    if (start_i > end_i) { // old list exhausted; process new list additions
      for (start_j; start_j <= end_j; start_b = b[++start_j]) {
        parent.insertBefore(start_b, afterNode);
      }
    } else { // new list exhausted; process old list removals
      for (start_i; start_i <= end_i; ++start_i) {
        parent.removeChild(a[start_i]);
      }
    }
  }
  return b;
};
