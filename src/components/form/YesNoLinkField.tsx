import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface YesNoWithLink {
  answer?: 'yes' | 'no';
  link?: string;
}

interface YesNoLinkFieldProps {
  value?: YesNoWithLink;
  onChange: (value: YesNoWithLink) => void;
  linkPlaceholder?: string;
  className?: string;
}

export function YesNoLinkField({
  value,
  onChange,
  linkPlaceholder = 'Enter link',
  className,
}: YesNoLinkFieldProps) {
  const handleAnswerChange = (answer: 'yes' | 'no') => {
    onChange({
      answer,
      link: answer === 'yes' ? (value?.link || '') : '',
    });
  };

  const handleLinkChange = (link: string) => {
    onChange({
      answer: value?.answer || 'yes',
      link,
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <RadioGroup
        value={value?.answer || ''}
        onValueChange={(val) => handleAnswerChange(val as 'yes' | 'no')}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id={`${linkPlaceholder}-yes`} />
          <Label htmlFor={`${linkPlaceholder}-yes`} className="font-normal">Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`${linkPlaceholder}-no`} />
          <Label htmlFor={`${linkPlaceholder}-no`} className="font-normal">No</Label>
        </div>
      </RadioGroup>
      
      {value?.answer === 'yes' && (
        <Input
          type="url"
          placeholder={linkPlaceholder}
          value={value?.link || ''}
          onChange={(e) => handleLinkChange(e.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );
}
