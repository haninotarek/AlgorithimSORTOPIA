const HEAD = `#include <iostream>
using namespace std;
`;

const DISPLAY = `
void display(int arr[], int n) {
    for (int i = 0; i < n; i++) @@print
        cout << arr[i] << " "; @@print
    cout << endl; @@print
}
`;

function mainCode(call) {
  return `
int main() {
    int arr[] = {ARR}; @@init
    int n = N; @@init

    ${call} @@call
    display(arr, n); @@call2

    return 0; @@end
}`;
}

const CODES = {
  bubble: HEAD + `
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) { @@outer
        for (int j = 0; j < n - 1 - i; j++) { @@inner
            if (arr[j] > arr[j + 1]) { @@cmp
                int temp = arr[j]; @@swap
                arr[j] = arr[j + 1]; @@swap
                arr[j + 1] = temp; @@swap
            }
        }
    }
}
` + DISPLAY + mainCode('bubbleSort(arr, n);'),

  bubbleOpt: HEAD + `
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) { @@outer
        bool swapped = false; @@flag
        for (int j = 0; j < n - 1 - i; j++) { @@inner
            if (arr[j] > arr[j + 1]) { @@cmp
                int temp = arr[j]; @@swap
                arr[j] = arr[j + 1]; @@swap
                arr[j + 1] = temp; @@swap
                swapped = true; @@swap
            }
        }
        if (!swapped) break; @@brk
    }
}
` + DISPLAY + mainCode('bubbleSort(arr, n);'),

  selection: HEAD + `
void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) { @@outer
        int minIndex = i; @@minInit
        for (int j = i + 1; j < n; j++) { @@inner
            if (arr[j] < arr[minIndex]) @@cmp
                minIndex = j; @@newMin
        }
        int temp = arr[i]; @@swap
        arr[i] = arr[minIndex]; @@swap
        arr[minIndex] = temp; @@swap
    }
}
` + DISPLAY + mainCode('selectionSort(arr, n);'),

  insertion: HEAD + `
void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) { @@outer
        int key = arr[i]; @@key
        int j = i - 1; @@jinit

        while (j >= 0 && arr[j] > key) { @@while
            arr[j + 1] = arr[j]; @@shift
            j--; @@shift
        }

        arr[j + 1] = key; @@place
    }
}
` + DISPLAY + mainCode('insertionSort(arr, n);'),

  merge: HEAD + `
void merge(int arr[], int left, int mid, int right) { @@mCall
    int n1 = mid - left + 1; @@sizes
    int n2 = right - mid; @@sizes
    int L[10], R[10]; @@sizes

    for (int i = 0; i < n1; i++) @@copy
        L[i] = arr[left + i]; @@copy

    for (int j = 0; j < n2; j++) @@copy
        R[j] = arr[mid + 1 + j]; @@copy

    int i = 0, j = 0, k = left; @@ptrs

    while (i < n1 && j < n2) { @@mloop
        if (L[i] <= R[j]) @@mcmp
            arr[k++] = L[i++]; @@takeL
        else
            arr[k++] = R[j++]; @@takeR
    }

    while (i < n1) @@restL
        arr[k++] = L[i++]; @@restL

    while (j < n2) @@restR
        arr[k++] = R[j++]; @@restR
}

void mergeSort(int arr[], int left, int right) { @@msCall
    if (left < right) { @@msIf
        int mid = left + (right - left) / 2; @@mid
        mergeSort(arr, left, mid); @@recL
        mergeSort(arr, mid + 1, right); @@recR
        merge(arr, left, mid, right); @@doMerge
    }
}
` + DISPLAY + mainCode('mergeSort(arr, 0, n - 1);'),

  quick: HEAD + `
int partition(int arr[], int low, int high) { @@pCall
    int pivot = arr[high]; @@pivot
    int i = low - 1; @@iinit

    for (int j = low; j < high; j++) { @@ploop
        if (arr[j] < pivot) { @@pcmp
            i++; @@pswap
            int temp = arr[i]; @@pswap
            arr[i] = arr[j]; @@pswap
            arr[j] = temp; @@pswap
        }
    }

    int temp = arr[i + 1]; @@pfinal
    arr[i + 1] = arr[high]; @@pfinal
    arr[high] = temp; @@pfinal

    return i + 1; @@pret
}

void quickSort(int arr[], int low, int high) { @@qsCall
    if (low < high) { @@qsIf
        int p = partition(arr, low, high); @@callP
        quickSort(arr, low, p - 1); @@recL
        quickSort(arr, p + 1, high); @@recR
    }
}
` + DISPLAY + mainCode('quickSort(arr, 0, n - 1);'),

  heap: HEAD + `
// Maintains the Max Heap property
void heapify(int arr[], int n, int i) { @@hCall
    int largest = i; @@hinit
    int left = 2 * i + 1; @@hinit
    int right = 2 * i + 2; @@hinit

    if (left < n && arr[left] > arr[largest]) @@hl
        largest = left; @@hlset

    if (right < n && arr[right] > arr[largest]) @@hr
        largest = right; @@hrset

    if (largest != i) { @@hcheck
        swap(arr[i], arr[largest]); @@hswap
        heapify(arr, n, largest); @@hrec
    }
}

// Builds a Max Heap
void buildHeap(int arr[], int n) { @@build
    for (int i = n / 2 - 1; i >= 0; i--) { @@bloop
        heapify(arr, n, i); @@bloop
    }
}

// Sorts the array in ascending order
void heapSort(int arr[], int n) {
    buildHeap(arr, n); @@callBuild

    for (int i = n - 1; i > 0; i--) { @@xloop
        swap(arr[0], arr[i]); @@xswap
        heapify(arr, i, 0); @@xheap
    }
}

int main() {
    int arr[] = {ARR}; @@init
    int n = sizeof(arr) / sizeof(arr[0]); @@init

    heapSort(arr, n); @@call

    cout << "Sorted array: "; @@print
    for (int i = 0; i < n; i++) { @@print
        cout << arr[i] << " "; @@print
    }

    return 0; @@end
}`
};

const ALGOS = [
  {
    id: 'bubble', en: 'Bubble Sort', ar: 'الفقاعات', icon: 'bubbles', color: '#12B5E0', deep: '#0A6F8C',
    tagline: 'أكبر رقم بيطفو لآخر الـ array زي الفقاعة',
    arr: [5, 1, 4, 2, 8],
    cx: { best: 'O(n)', bestNote: 'بالـ swapped flag بس', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, paradigm: 'Brute Force' },
    story: `تخيّل كوباية مياه غازية — الفقاعة الكبيرة بتطلع لفوق الأول.
      <b>Bubble Sort</b> بيعمل نفس الحكاية بالظبط: بيمشي على الـ array ويقارن كل <b>اتنين جنب بعض</b> (adjacent)،
      ولو الشمال أكبر من اليمين يبدّلهم. في آخر كل لفة (<b>pass</b>) أكبر رقم في الجزء اللي لسه مش مترتب بيكون
      <em>طفى</em> لآخره ووصل لمكانه النهائي — ومش هنلمسه تاني.`,
    steps: ['قارن العنصرين المتجاورين (adjacent)', 'بدّلهم لو في الترتيب الغلط', 'كرر الكلام ده على كل عناصر الليستة', 'لما تعدي pass كاملة من غير ولا swap → الليستة مترتبة'],
    tips: [
      'الـ inner loop بيقف عند <code>n - 1 - i</code> لأن آخر i عناصر خلاص في مكانهم.',
      'عدد الـ passes في الكود = <code>n - 1</code>.',
      'بعد Pass رقم k → أكبر k أرقام بيكونوا في آخر الـ array مترتبين.',
      'كود الـ AllCode من غير <code>swapped</code> flag → دايماً O(n²). النسخة Optimized بتعمل break بدري → Best case O(n).',
      'Stable [[i:check]] لأن الشرط <code>&gt;</code> مش <code>&gt;=</code> فالمتساويين مبيتبدلوش.'
    ]
  },
  {
    id: 'selection', en: 'Selection Sort', ar: 'الاختيار', icon: 'target', color: '#FF4F9A', deep: '#B0195F',
    tagline: 'دوّر على الأصغر… وحطه في أول الطابور',
    arr: [29, 10, 14, 37, 13],
    cx: { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false, paradigm: 'Brute Force' },
    story: `تخيّل كابتن فريق بيرتب اللاعيبة بالطول: كل مرة يبص على <b>كل</b> اللي لسه ماتحطوش في مكانهم،
      ويختار <b>الأقصر</b> فيهم، ويوقفه في أول مكان فاضي في الطابور. وبس كده!
      <b>Selection Sort</b> بيقسم الـ array لجزئين: جزء مترتب على الشمال (بيبدأ فاضي) وجزء مش مترتب،
      وكل pass بيختار أصغر رقم من الجزء المش مترتب ويبدله مع أول عنصر فيه.`,
    steps: ['قسّم الليستة: جزء مترتب (فاضي في الأول) + جزء مش مترتب (الليستة كلها)', 'دوّر على أصغر عنصر في الجزء المش مترتب', 'بدّله مع أول عنصر في الجزء المش مترتب → الجزء المترتب كبر بعنصر', 'كرر لحد ما الكل يترتب'],
    tips: [
      '<code>minIndex</code> بيبدأ كل pass بـ <code>i</code> — يعني بنفترض إن أول عنصر هو الأصغر لحد ما نلاقي أصغر منه.',
      'swap واحدة بس في كل pass → أقصى عدد swaps = <code>n - 1</code> (أقل بكتير من Bubble).',
      'عدد المقارنات ثابت <code>n(n-1)/2</code> حتى لو الـ array مترتبة → O(n²) في كل الحالات.',
      'مش Stable [[i:x]] — الـ swap البعيدة ممكن تقلب ترتيب المتساويين.',
      'سؤال صح وغلط مشهور: "Selection بيبدّل adjacent items" ← <b>غلط</b>، دي Bubble.'
    ]
  },
  {
    id: 'insertion', en: 'Insertion Sort', ar: 'الإدراج', icon: 'cards', color: '#FFA41B', deep: '#A35F00',
    tagline: 'زي ما بترتب الكوتشينة في إيدك بالظبط',
    arr: [7, 4, 5, 2, 9],
    cx: { best: 'O(n)', bestNote: 'لو مترتبة أصلاً', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, paradigm: 'Incremental' },
    story: `وانت بتلعب كوتشينة: بتسحب كارت جديد (ده الـ <b>key</b>)، وتبص على الكروت اللي في إيدك من اليمين للشمال،
      وكل كارت <b>أكبر</b> منه تزحزحه خطوة يمين، لحد ما تلاقي فراغ مناسب تحط فيه الكارت.
      <b>Insertion Sort</b> بيبني الـ array المترتبة <b>عنصر عنصر</b> من الشمال لليمين.`,
    steps: ['ابدأ من تاني عنصر (i = 1) — أول عنصر لوحده يعتبر مترتب', 'خد العنصر ده كـ key وقارنه باللي قبله', 'زحزح كل عنصر أكبر من الـ key خطوة يمين', 'حط الـ key في الفراغ — والجزء المترتب كبر بعنصر'],
    tips: [
      'بيبدأ من <code>i = 1</code> مش 0.',
      'بيعمل <b>shift</b> مش swap: <code>arr[j + 1] = arr[j]</code>.',
      'لما الـ while تخلص، مكان الـ key هو <code>j + 1</code> (مش j!).',
      'Best case O(n) لو الـ array مترتبة أصلاً — الـ while مبتلفش خالص.',
      'Stable [[i:check]] (الشرط <code>arr[j] &gt; key</code>) وممتاز للـ arrays الصغيرة أو شبه المترتبة.'
    ]
  },
  {
    id: 'merge', en: 'Merge Sort', ar: 'الدمج', icon: 'merge', color: '#1FC37A', deep: '#0B7A48',
    tagline: 'قسّم لحد عنصر واحد… وبعدين ادمج وانت بترتب',
    arr: [38, 27, 43, 3, 9, 82, 10],
    cx: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true, paradigm: 'Divide & Conquer' },
    story: `<b>فرّق تَسُد</b> — بدل ما ترتب 7 أرقام مرة واحدة، قسّمهم نصين، وكل نص نصين… لحد ما كل جزء يبقى
      <b>عنصر واحد</b> (وعنصر واحد مترتب لوحده طبعاً). بعد كده نرجع <b>ندمج</b> كل جزئين مترتبين في جزء واحد مترتب:
      نقارن أول عنصر في الشمال (L) مع أول عنصر في اليمين (R) والأصغر ينزل الأول.`,
    steps: ['Divide: قسّم الـ array نصين بشكل recursive لحد ما كل جزء يبقى عنصر واحد', 'Conquer: كل نص بيترتب لوحده (recursion)', 'Combine: ادمج النصين المترتبين بمقارنة L[i] مع R[j]', 'الأصغر بيتكتب في arr[k] — ولما نص يخلص، انسخ الباقي من التاني'],
    tips: [
      '<code>mid = left + (right - left) / 2</code> — مثلاً (0, 6) → mid = 3.',
      'Base case: <code>left &gt;= right</code> يعني عنصر واحد أو مفيش.',
      'O(n log n) في <b>كل</b> الحالات — بس محتاج memory زيادة O(n) للـ L و R.',
      'علامة <code>&lt;=</code> في <code>L[i] &lt;= R[j]</code> هي اللي بتخليه Stable [[i:check]].',
      'في كود المادة <code>L[10], R[10]</code> حجم ثابت → الـ array لازم تكون صغيرة.'
    ]
  },
  {
    id: 'quick', en: 'Quick Sort', ar: 'السريع', icon: 'zap', color: '#FF6A3D', deep: '#B23A12',
    tagline: 'اختار pivot… الأصغر شماله والباقي يمينه',
    arr: [50, 10, 30, 100, 20],
    cx: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false, paradigm: 'Divide & Conquer' },
    story: `اختار واحد يبقى <b>pivot</b> [[i:crown]] (في كودنا: <b>آخر عنصر</b>)، وقسّم الباقيين: كل اللي <b>أصغر</b> منه يروح شماله،
      والباقي يفضل يمينه. خلاص كده الـ pivot وقف في <b>مكانه النهائي</b> للأبد!
      بعد كده نكرر نفس الحكاية على الجزء الشمال لوحده، واليمين لوحده — recursion.`,
    steps: ['Choose pivot: اختار آخر عنصر في الجزء كـ pivot', 'Partition: الأصغر من الـ pivot شماله والأكبر يمينه', 'Recursion: رتّب الشمال واليمين بنفس الطريقة', 'Combine: الأجزاء المترتبة + الـ pivot في النص = array مترتبة'],
    tips: [
      '<code>i</code> بيبدأ من <code>low - 1</code> وبيشاور على آخر عنصر أصغر من الـ pivot.',
      'الشرط <code>arr[j] &lt; pivot</code> — أصغر بس، فالمساوي بيفضل ناحية اليمين.',
      'بعد كل partition الـ pivot بيبقى في index <code>i + 1</code> وده مكانه النهائي.',
      'Worst case O(n²) لما الـ array تكون مترتبة أصلاً والـ pivot آخر عنصر.',
      'In-place بس مش Stable [[i:x]].'
    ]
  },
  {
    id: 'heap', en: 'Heap Sort', ar: 'الكومة', icon: 'tree', color: '#8B5CF6', deep: '#5B2BC4',
    tagline: 'ابني شجرة الأكبر فوق… وشيل الملك واحد واحد',
    arr: [4, 10, 3, 5, 1],
    cx: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false, paradigm: 'Heap / Selection' },
    story: `تخيّل مملكة [[i:crown]] كل <b>أب</b> فيها لازم يكون أكبر من (أو يساوي) <b>ولاده</b> — ده اسمه <b>Max Heap</b>.
      يبقى الملك (الـ root في index 0) هو أكبر واحد في المملكة كلها. الخطة: نبني الـ heap، نشيل الملك ونحطه في
      <b>آخر</b> الـ array، نختار ملك جديد بـ heapify… ونكرر لحد ما الكل يترتب.
      الـ array نفسها هي الشجرة: الأب في <code>i</code> وولاده في <code>2i + 1</code> و <code>2i + 2</code>.`,
    steps: ['Heapify: خلي الأب أكبر من ولاده — لو لأ بدّله مع الأكبر وكمّل لتحت', 'Build Max-Heap: من آخر non-leaf (n/2 - 1) لحد الـ root', 'Extract Max: بدّل الـ root مع آخر عنصر في الـ heap', 'صغّر الـ heap بعنصر واعمل heapify للـ root — وكرر'],
    tips: [
      'left = <code>2i + 1</code> ، right = <code>2i + 2</code> ، parent = <code>(i - 1) / 2</code>.',
      'buildHeap بتبدأ من <code>n / 2 - 1</code> (آخر أب) وتنزل لحد 0 — bottom-up.',
      'في مرحلة الـ extract: <code>heapify(arr, i, 0)</code> — الحجم بقى <code>i</code> مش <code>n</code>.',
      'O(n log n) في كل الحالات و O(1) memory.',
      'مش Stable [[i:x]].'
    ]
  }
];
